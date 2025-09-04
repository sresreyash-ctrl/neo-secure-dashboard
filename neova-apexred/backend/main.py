import os
import json
import subprocess
from fastapi import FastAPI, Body
from fastapi.responses import JSONResponse, FileResponse
import logging
import time
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from datetime import datetime
from typing import Tuple, List, Dict, Any

# OpenAI and PDF
from openai import OpenAI
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.utils import simpleSplit
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_methods=["*"],
    allow_headers=["*"],
)

V2_DIR = os.path.join(os.path.dirname(__file__), '..', 'v2')
EXE_PATH = os.path.join(V2_DIR, 'neova-apexred.exe')
BUILD_CMD = 'go mod tidy && go build -o neova-apexred.exe ./cmd/stratus'

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

# Helper to build stratus if not built
def ensure_stratus_built():
    logging.info(f"Checking for v2 directory at: {V2_DIR}")
    if not os.path.isdir(V2_DIR):
        logging.error(f"v2 directory not found at: {V2_DIR}")
        raise RuntimeError(f"v2 directory not found at: {V2_DIR}")

    logging.info(f"Checking for stratus binary at: {EXE_PATH}")
    if os.path.exists(EXE_PATH):
        logging.info('Stratus binary is available.')
        return

    logging.info('Stratus binary not found. Building...')
    logging.info(f"Executing build command: {BUILD_CMD}")
    build_proc = subprocess.Popen(
        BUILD_CMD, shell=True, cwd=V2_DIR,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
    stdout, stderr = build_proc.communicate()
    logging.info('Build command finished.')
    logging.info('Build stdout:\n%s', stdout)
    logging.info('Build stderr:\n%s', stderr)
    if build_proc.returncode == 0:
        logging.info('Stratus build completed successfully.')
        if os.path.exists(EXE_PATH):
            logging.info('Verified: Stratus binary created.')
        else:
            logging.error('Build succeeded but stratus binary not found after build.')
            raise RuntimeError('Build succeeded but stratus binary not found.')
    else:
        logging.error('Stratus build failed with exit code %d.', build_proc.returncode)
        logging.error('Build stdout:\n%s', stdout)
        logging.error('Build stderr:\n%s', stderr)
        raise RuntimeError(f'Stratus build failed. See logs above.\nSTDOUT:\n{stdout}\nSTDERR:\n{stderr}')

@app.on_event('startup')
def startup_event():
    logging.info('FastAPI startup event triggered.')
    ensure_stratus_built()

ENV_FILE = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(ENV_FILE):
    load_dotenv(ENV_FILE)
    logging.info(f"Loaded environment variables from {ENV_FILE}")
else:
    logging.warning(f"No .env file found at {ENV_FILE}. Environment variables must be set externally.")

def ensure_aws_env():
    """Ensure AWS environment variables are present before running attacks."""
    required_vars = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"]
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        raise RuntimeError(f"Missing required AWS environment variables: {', '.join(missing)}")
    logging.info("All required AWS environment variables are present.")

@app.post("/attack/run")
def run_attack(payload: dict = Body(...)):
    technique_id = payload.get("technique_id")
    if not technique_id:
        return JSONResponse({"error": "No technique_id provided"}, status_code=400)

    logging.info(f"POST /attack/run called with technique_id={technique_id}")
    ensure_stratus_built()
    ensure_aws_env()

    env = os.environ.copy()  # use only what's in env / .env
    logging.info("Using AWS environment variables from env/.env")

    # Warmup
    logging.info(f"Running warmup for {technique_id}.")
    warmup = subprocess.run(
        [EXE_PATH, "warmup", technique_id],
        cwd=V2_DIR, capture_output=True, text=True, env=env
    )

    # Detonate
    logging.info(f"Running detonate for {technique_id}.")
    detonate = subprocess.run(
        [EXE_PATH, "detonate", technique_id],
        cwd=V2_DIR, capture_output=True, text=True, env=env
    )

    logging.info("Waiting 10 seconds before cleanup...")
    time.sleep(10)

    # Cleanup
    logging.info(f"Running cleanup for {technique_id}.")
    cleanup = subprocess.run(
        [EXE_PATH, "cleanup", technique_id],
        cwd=V2_DIR, capture_output=True, text=True, env=env
    )

    # Prepare result JSON (split into lists of lines for readability)
    result = {
        "technique_id": technique_id,
        "warmup_output": warmup.stdout.strip().splitlines(),
        "warmup_error": warmup.stderr.strip().splitlines(),
        "detonate_output": detonate.stdout.strip().splitlines(),
        "detonate_error": detonate.stderr.strip().splitlines(),
        "cleanup_output": cleanup.stdout.strip().splitlines(),
        "cleanup_error": cleanup.stderr.strip().splitlines(),
    }

    # Ensure logs folder exists
    logs_dir = os.path.join(os.path.dirname(__file__), "attack-logs")
    os.makedirs(logs_dir, exist_ok=True)

    # Save logs to JSON file
    log_file = os.path.join(logs_dir, f"{technique_id}.json")
    with open(log_file, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=4)

    logging.info(f"Attack logs saved to {log_file}")
    return JSONResponse(result)


@app.post('/undo/s3')
def undo_attack_s3():
    logging.info('POST /undo/s3 called.')
    ensure_stratus_built()
    logging.info('Running revert for aws.exfiltration.ec2-share-ami.')
    result = subprocess.run([EXE_PATH, 'revert', 'aws.exfiltration.ec2-share-ami'], cwd=V2_DIR, capture_output=True, text=True)
    logging.info('Revert stdout: %s', result.stdout)
    logging.info('Revert stderr: %s', result.stderr)
    return JSONResponse({'output': result.stdout, 'error': result.stderr})

@app.get("/ping")
def ping():
    return {"message": "pong"}

ENV_FILE = os.path.join(os.path.dirname(__file__), ".env")

@app.post("/save-aws-config")
def save_aws_config(config: dict = Body(...)):
    try:
        # Format env content
        env_content = [
            f"AWS_ACCESS_KEY_ID={config.get('accessKeyId', '')}",
            f"AWS_SECRET_ACCESS_KEY={config.get('secretAccessKey', '')}",
            f"AWS_REGION={config.get('region', '')}",
        ]
        with open(ENV_FILE, "w") as f:
            f.write("\n".join(env_content))
        return JSONResponse({"message": "AWS configuration saved to .env successfully"})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.post("/save-openai-key")
def save_openai_key(payload: dict = Body(...)):
    try:
        provided_key = payload.get("apiKey", "").strip()
        if not provided_key:
            return JSONResponse({"error": "apiKey is required"}, status_code=400)

        # Read existing .env lines if file exists
        existing_lines = []
        if os.path.exists(ENV_FILE):
            with open(ENV_FILE, "r", encoding="utf-8") as f:
                existing_lines = [line.rstrip("\n") for line in f.readlines()]

        # Build a dict of current key-values from .env (simple split on first '=')
        env_map = {}
        for line in existing_lines:
            if not line or line.strip().startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            env_map[key] = value

        # Update the OPENAI_API_KEY
        env_map["OPENAI_API_KEY"] = provided_key

        # Ensure AWS variables remain if previously written by /save-aws-config
        ordered_keys = [
            "AWS_ACCESS_KEY_ID",
            "AWS_SECRET_ACCESS_KEY",
            "AWS_REGION",
            "OPENAI_API_KEY",
        ]

        # Reconstruct env file content, keeping known keys ordered, then others
        content_lines = []
        for k in ordered_keys:
            if k in env_map:
                content_lines.append(f"{k}={env_map[k]}")
        # Append any other keys that might exist
        for k, v in env_map.items():
            if k not in ordered_keys:
                content_lines.append(f"{k}={v}")

        with open(ENV_FILE, "w", encoding="utf-8") as f:
            f.write("\n".join(content_lines))

        return JSONResponse({"message": "OpenAI API key saved to .env successfully"})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
    
@app.post("/fetch-cloudtrail-logs")
def fetch_cloudtrail_logs(payload: dict = Body(...)):
    try:
        user_curl = payload.get("curl", "")

        # Ensure AWS env vars exist
        ensure_aws_env()

        # Define output file
        logs_dir = os.path.join(os.path.dirname(__file__), "cloudtrail-logs")
        os.makedirs(logs_dir, exist_ok=True)
        log_file = os.path.join(logs_dir, "Detection_Logs.json")

        # Use region from environment (saved via /save-aws-config), fallback to us-east-1
        region = os.getenv("AWS_REGION", "us-east-1")

        # Build AWS CLI command (CloudTrail supports a single --lookup-attributes per call)
        cmd = [
            "aws", "cloudtrail", "lookup-events",
            "--lookup-attributes", "AttributeKey=EventName,AttributeValue=StopLogging",
            "--max-results", "60",
            "--region", region,
            "--output", "json"
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            env=os.environ.copy()
        )

        if result.returncode != 0:
            return JSONResponse(
                {"error": "Failed to fetch CloudTrail logs", "stderr": result.stderr},
                status_code=500
            )

        logs_json = json.loads(result.stdout)

        # Optionally filter by the stratus user if present
        try:
            events = logs_json.get("Events", [])
            filtered = [e for e in events if e.get("Username") == "stratus-redteam-cli-user"]
            if filtered:
                logs_json["Events"] = filtered
        except Exception:
            # Keep original if filtering fails
            pass

        # Save logs (post-filter)
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(logs_json, f, indent=2)

        return JSONResponse({
            "message": "Detection logs fetched successfully",
            "user_curl": user_curl,   # just echo back what user gave
            "logs": logs_json,
            "path": log_file,
            "region": region
        })

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


# Improved helper: Render markdown to PDF with better table formatting
def _render_markdown_to_pdf(markdown_text: str, pdf_path: str) -> None:
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import mm
    from reportlab.lib.utils import simpleSplit
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_LEFT, TA_CENTER
    import re
    
    doc = SimpleDocTemplate(pdf_path, pagesize=A4, 
                          rightMargin=12*mm, leftMargin=12*mm,
                          topMargin=15*mm, bottomMargin=15*mm)
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=12,
        textColor=colors.red,
        alignment=TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading3'],
        fontSize=12,
        spaceAfter=8,
        textColor=colors.black,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=11,
        spaceAfter=6,
        spaceBefore=12,
        textColor=colors.darkblue
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=9,
        spaceAfter=6,
        alignment=TA_LEFT
    )

    def clean_table_cell(text, is_header=False):
        """Clean table cell text specifically"""
        if not text:
            return ""
        
        # Remove all types of formatting markers
        text = str(text).strip()
        
        # Remove emojis first
        emoji_chars = ['ðŸ"´', 'âš ï¸', 'âœ…', 'âŒ', 'ðŸ"Š', 'ðŸ"', '•']
        for emoji in emoji_chars:
            text = text.replace(emoji, '')
        
        if is_header:
            # For headers: remove ALL formatting markers
            # Remove **<b>text</b>** -> text
            text = re.sub(r'\*\*<b>(.*?)</b>\*\*', r'\1', text)
            # Remove **text** -> text
            text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
            # Remove <b>text</b> -> text
            text = re.sub(r'<b>(.*?)</b>', r'\1', text)
            # Remove any remaining HTML tags
            text = re.sub(r'<[^>]*>', '', text)
            # Remove any remaining asterisks
            text = text.replace('*', '').replace('**', '')
        else:
            # For data cells: clean but preserve some formatting
            # Remove problematic combinations
            text = re.sub(r'\*\*<b>(.*?)</b>\*\*', r'\1', text)
            text = re.sub(r'<b>(.*?)</b>', r'\1', text)
            # Simple ** to bold conversion
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
        
        # Final cleanup
        text = text.replace('â€"', '-').replace('â€¢', '•')
        text = ' '.join(text.split())  # Remove extra whitespace
        
        return text.strip()

    def clean_text_for_pdf(text):
        """Clean regular paragraph text"""
        if not text:
            return ""
            
        # Remove emojis
        emoji_chars = ['ðŸ"´', 'âš ï¸', 'âœ…', 'âŒ', 'ðŸ"Š', 'ðŸ"']
        for emoji in emoji_chars:
            text = text.replace(emoji, '')
        
        # Simple bold conversion
        text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
        text = text.replace('â€"', '-').replace('â€¢', '•')
        
        return text.strip()
    
    story = []
    lines = markdown_text.split('\n')
    i = 0
    
    while i < len(lines):
        line = lines[i].strip()
        
        if not line:
            story.append(Spacer(1, 6))
            i += 1
            continue
            
        # Title (H1)
        if line.startswith('# '):
            title_text = clean_text_for_pdf(line[2:])
            story.append(Paragraph(title_text, title_style))
            
        # Subtitle (H3 with **)
        elif line.startswith('### **') and line.endswith('**'):
            subtitle_text = clean_text_for_pdf(line[6:-2])
            story.append(Paragraph(f"<i>{subtitle_text}</i>", subtitle_style))
            
        # Headings (H2)
        elif line.startswith('## '):
            heading_text = clean_text_for_pdf(line[3:])
            story.append(Paragraph(heading_text, heading_style))
            
        # Table detection
        elif line.startswith('|') and '|' in line:
            table_data = []
            is_first_data_row = True
            
            # Collect all table rows
            while i < len(lines) and lines[i].strip().startswith('|'):
                row_line = lines[i].strip()
                # Skip separator rows (containing ---)
                if '---' not in row_line:
                    # Split by | and clean up
                    raw_cells = row_line.split('|')[1:-1]  # Remove first and last empty elements
                    
                    if raw_cells:  # Only process non-empty rows
                        cleaned_cells = []
                        
                        for j, cell in enumerate(raw_cells):
                            cell = cell.strip()
                            
                            # Check if this is a header row by looking for **<b> patterns
                            is_header_cell = '**<b>' in cell or (is_first_data_row and ('**' in cell or '<b>' in cell))
                            
                            cleaned_cell = clean_table_cell(cell, is_header=is_header_cell)
                            
                            # Create paragraph for text wrapping, with different styles for headers vs data
                            if is_header_cell:
                                cell_style = ParagraphStyle(
                                    'HeaderCell',
                                    parent=styles['Normal'],
                                    fontSize=8,
                                    leading=10,
                                    fontName='Helvetica-Bold',
                                    alignment=TA_CENTER
                                )
                            else:
                                cell_style = ParagraphStyle(
                                    'DataCell',
                                    parent=styles['Normal'],
                                    fontSize=7,
                                    leading=9,
                                    fontName='Helvetica'
                                )
                            
                            # Wrap all cells in Paragraphs for better text handling
                            cell_para = Paragraph(cleaned_cell, cell_style)
                            cleaned_cells.append(cell_para)
                        
                        table_data.append(cleaned_cells)
                        is_first_data_row = False
                
                i += 1
            i -= 1  # Adjust for the outer loop increment
            
            if table_data:
                # Calculate column widths
                num_cols = len(table_data[0]) if table_data else 0
                if num_cols > 0:
                    # Available width (accounting for margins)
                    page_width = A4[0] - 24*mm  # Total margins
                    
                    # Define column widths for your 6-column table
                    if num_cols == 6:
                        col_widths = [
                            page_width * 0.18,  # Technique ID
                            page_width * 0.12,  # Tactic
                            page_width * 0.15,  # Time
                            page_width * 0.18,  # Actor
                            page_width * 0.22,  # Trail Targeted
                            page_width * 0.15   # Result
                        ]
                    else:
                        # Default: equal widths
                        col_widths = [page_width / num_cols] * num_cols
                    
                    # Create table with specified column widths
                    table = Table(table_data, colWidths=col_widths, repeatRows=1)
                    
                    # Table styling
                    table_style = [
                        # Header row (first row)
                        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                        
                        # All cells
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                        
                        # Padding - reduced for better fit
                        ('TOPPADDING', (0, 0), (-1, -1), 3),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                        ('LEFTPADDING', (0, 0), (-1, -1), 2),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
                        
                        # Borders
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
                        
                        # Alternating row colors (skip header)
                        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
                    ]
                    
                    table.setStyle(TableStyle(table_style))
                    story.append(table)
                    story.append(Spacer(1, 12))
                
        # Bullet points
        elif line.startswith('- ') or line.startswith('* '):
            bullet_text = clean_text_for_pdf(line[2:])
            story.append(Paragraph(f"• {bullet_text}", normal_style))
            
        # Regular paragraphs
        else:
            if line:
                clean_line = clean_text_for_pdf(line)
                if clean_line:  # Only add non-empty paragraphs
                    story.append(Paragraph(clean_line, normal_style))
        
        i += 1
    
    try:
        doc.build(story)
        logging.info(f"PDF successfully generated at {pdf_path}")
    except Exception as e:
        # Fallback: create a simpler PDF if complex formatting fails
        logging.warning(f"Complex PDF generation failed: {e}. Creating simple version.")
        _render_simple_pdf(markdown_text, pdf_path)


def _render_simple_pdf(markdown_text: str, pdf_path: str) -> None:
    """Fallback simple PDF renderer without complex HTML formatting"""
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.utils import simpleSplit
    import re
    
    c = canvas.Canvas(pdf_path, pagesize=A4)
    width, height = A4
    left_margin = 20 * mm
    right_margin = 20 * mm
    top_margin = 20 * mm
    bottom_margin = 20 * mm
    usable_width = width - left_margin - right_margin

    y = height - top_margin
    line_height = 12

    def clean_simple_text(text):
        """Simple text cleaning for fallback PDF"""
        # Remove emojis and markdown
        text = re.sub(r'[^\x00-\x7F]+', '', text)  # Remove non-ASCII
        text = text.replace('**', '').replace('*', '')
        text = re.sub(r'<[^>]+>', '', text)  # Remove HTML tags
        return text.strip()

    def draw_wrapped_text(text: str, font_name: str = "Helvetica", font_size: int = 10):
        nonlocal y
        clean_text = clean_simple_text(text)
        
        c.setFont(font_name, font_size)
        lines = simpleSplit(clean_text, font_name, font_size, usable_width)
        for line in lines:
            if y <= bottom_margin + 20:
                c.showPage()
                y = height - top_margin
                c.setFont(font_name, font_size)
            c.drawString(left_margin, y, line)
            y -= line_height

    # Process lines
    for line in markdown_text.splitlines():
        line = line.strip()
        if not line:
            y -= line_height // 2
            continue
            
        if line.startswith('# '):
            draw_wrapped_text(line[2:], "Helvetica-Bold", 14)
            y -= 5
        elif line.startswith('### **') and line.endswith('**'):
            draw_wrapped_text(line[6:-2], "Helvetica-Bold", 11)
            y -= 3
        elif line.startswith('## '):
            draw_wrapped_text(line[3:], "Helvetica-Bold", 11)
            y -= 3
        elif line.startswith('|') and '|' in line and not ('---' in line):
            # Simple table row
            cells = [cell.strip() for cell in line.split('|')[1:-1]]
            if cells:
                # Clean and truncate cells for simple display
                clean_cells = []
                for cell in cells:
                    cleaned = clean_simple_text(cell)
                    # Truncate long cells
                    if len(cleaned) > 15:
                        cleaned = cleaned[:12] + "..."
                    clean_cells.append(cleaned)
                row_text = " | ".join(clean_cells)
                draw_wrapped_text(row_text, "Helvetica", 8)
        elif line.startswith('- ') or line.startswith('* '):
            draw_wrapped_text(f"• {line[2:]}", "Helvetica", 9)
        else:
            draw_wrapped_text(line, "Helvetica", 9)

    c.save()


@app.post("/generate-report")
def generate_report(payload: dict = Body(...)):
    try:
        # Paths
        backend_dir = os.path.dirname(__file__)
        attack_logs_path = os.path.join(backend_dir, "attack-logs", "aws.defense-evasion.cloudtrail-stop.json")
        cloudtrail_logs_path = os.path.join(backend_dir, "cloudtrail-logs", "Detection_Logs.json")

        # Allow payload overrides for custom paths
        attack_logs_path = payload.get("attackLogsPath", attack_logs_path)
        cloudtrail_logs_path = payload.get("cloudtrailLogsPath", cloudtrail_logs_path)

        # Read JSON inputs
        if not os.path.exists(attack_logs_path):
            return JSONResponse({"error": f"Attack log not found at {attack_logs_path}"}, status_code=400)
        if not os.path.exists(cloudtrail_logs_path):
            return JSONResponse({"error": f"CloudTrail log not found at {cloudtrail_logs_path}"}, status_code=400)

        with open(attack_logs_path, "r", encoding="utf-8") as f:
            attack_json = json.load(f)
        with open(cloudtrail_logs_path, "r", encoding="utf-8") as f:
            cloudtrail_json = json.load(f)

        # Build the updated prompt (to match your report.docx style + MITRE Mapping)
        full_prompt = f"""
You are a senior cloud security analyst. Compare two JSON files:
1. ATTACK_LOG_JSON (from red-team framework, e.g., aws.defense-evasion.cloudtrail-stop.json)
2. DETECTION_LOG_JSON (from security product, e.g., Detection_Logs.json)

Your task:
- Write an incident analysis report in the **exact structure and tone** as the reference report provided earlier.
- Keep it concise, professional, and in plain English (no speculation).

=== REPORT STRUCTURE ===

# Security Log Analysis Report

## Executive Summary
Summarize whether the detection was successful. Clearly state if the product detected the key attack (StopLogging). Mention if context/narrative was missing.

## 1. Attack Log Analysis
- Log Source: Attack Log  
- Describe what the attack log shows (framework, technique_id, actor, goal, key action, time, userAgent).  
- Mention full attack narrative (warmup → detonate → revert).

## 2. Detection Log Analysis
- Log Source: Detection Log  
- Describe what the detection product recorded (event name, user, timestamp, source).  
- Note if contextual info (e.g., userAgent, sequence) is missing.

## 3. Comparison and Findings
Present a table with columns: **Feature | Attack Log | Detection Log | Findings**.  
Include rows for Event Name, User, Timestamp, User Agent, Context.  
Mark detections as "Detected" or "Missed" in Findings.

## Conclusion and Recommendations
- State how well the product performed.  
- Point out missing pieces (userAgent, context, attack sequence).  
- Give 2–3 concrete recommendations:
  - Enrich logs with more fields.  
  - Detect sequences instead of isolated events.  
  - Generate narrative-based alerts.

## MITRE Mapping
Add the MITRE ATT&CK technique ID and tactic used in this attack.  
For example:  
- **Technique:** T1562.002 – Impair Defenses: Disable CloudTrail Logging  
- **Tactic:** Defense Evasion

=== INPUT DATA ===
- ATTACK_LOG_JSON: {json.dumps(attack_json)}
- DETECTION_LOG_JSON: {json.dumps(cloudtrail_json)}

{payload.get('instructions', '')}
"""

        # Call OpenAI
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key:
            return JSONResponse({"error": "OPENAI_API_KEY not set. Use /save-openai-key first."}, status_code=400)

        client = OpenAI(api_key=api_key)

        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "user", "content": full_prompt},
            ],
            temperature=0.2,
        )

        content = completion.choices[0].message.content if completion and completion.choices else ""
        if not content:
            return JSONResponse({"error": "Empty response from model"}, status_code=500)

        # Create output dir and PDF path
        reports_dir = os.path.join(backend_dir, "reports")
        os.makedirs(reports_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"attack_detection_report_{timestamp}.pdf"
        pdf_path = os.path.join(reports_dir, filename)

        # Render PDF with improved formatting
        _render_markdown_to_pdf(content, pdf_path)

        return JSONResponse({
            "message": "Report generated",
            "markdown": content,
            "filename": filename,
            "download_url": f"/reports/download?filename={filename}"
        })
    except Exception as e:
        logging.exception("Failed to generate report")
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/reports/download")
def download_report(filename: str):
    try:
        backend_dir = os.path.dirname(__file__)
        reports_dir = os.path.join(backend_dir, "reports")
        safe_name = os.path.basename(filename)
        file_path = os.path.join(reports_dir, safe_name)

        if not os.path.exists(file_path):
            return JSONResponse({"error": f"File not found: {safe_name}"}, status_code=404)

        return FileResponse(
            path=file_path,
            media_type="application/pdf",
            filename=safe_name
        )
    except Exception as e:
        logging.exception("Failed to download report")
        return JSONResponse({"error": str(e)}, status_code=500)