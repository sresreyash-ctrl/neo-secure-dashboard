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
            "--max-results", "50",
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
            "message": "CloudTrail logs fetched successfully",
            "user_curl": user_curl,   # just echo back what user gave
            "logs": logs_json,
            "path": log_file,
            "region": region
        })

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


# Helper: Render markdown-ish text to a simple PDF using ReportLab
def _render_markdown_to_pdf(markdown_text: str, pdf_path: str) -> None:
    c = canvas.Canvas(pdf_path, pagesize=A4)
    width, height = A4
    left_margin = 20 * mm
    right_margin = 20 * mm
    top_margin = 20 * mm
    bottom_margin = 20 * mm
    usable_width = width - left_margin - right_margin

    y = height - top_margin
    line_height = 12

    def draw_wrapped(text: str, font_name: str = "Helvetica", font_size: int = 10, bold: bool = False):
        nonlocal y
        if bold:
            font_name = "Helvetica-Bold"
        c.setFont(font_name, font_size)
        lines = simpleSplit(text, font_name, font_size, usable_width)
        for line in lines:
            if y <= bottom_margin:
                c.showPage()
                y = height - top_margin
                c.setFont(font_name, font_size)
            c.drawString(left_margin, y, line)
            y -= line_height

    # Very minimal markdown cues: headings and bullets
    for raw_line in markdown_text.splitlines():
        line = raw_line.rstrip()
        if not line:
            y -= line_height
            continue
        if line.startswith("### "):
            draw_wrapped(line[4:], font_size=12, bold=True)
            y -= 2
        elif line.startswith("## "):
            draw_wrapped(line[3:], font_size=14, bold=True)
            y -= 4
        elif line.startswith("# "):
            draw_wrapped(line[2:], font_size=16, bold=True)
            y -= 6
        elif line.startswith("- ") or line.startswith("* "):
            draw_wrapped("• " + line[2:], font_size=10)
        elif line.startswith("|") and line.endswith("|"):
            # rudimentary table row rendering
            draw_wrapped(line.replace("|", "|"))
        else:
            draw_wrapped(line)

    c.showPage()
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

        # Build the system/user prompt per user spec
        system_prompt = (
            "You are a senior cloud security log analyst. You will read two JSON inputs and produce a concise, UI-ready incident report about attempts to disable AWS CloudTrail logging. You must be accurate, correlate the logs, and avoid speculation."
        )

        full_prompt = f"""ROLE
You are a senior cloud security log analyst. You will read two JSON inputs and produce a concise, UI-ready incident report about attempts to disable AWS CloudTrail logging. You must be accurate, correlate the logs, and avoid speculation.

INPUTS
- ATTACK_LOG_JSON: {json.dumps(attack_json)}
- CLOUDTRAIL_JSON: {json.dumps(cloudtrail_json)}

{payload.get('instructions', '')}
"""

        # Call OpenAI
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key:
            return JSONResponse({"error": "OPENAI_API_KEY not set. Use /save-openai-key first."}, status_code=400)

        client = OpenAI(api_key=api_key)

        # Use responses.create (Chat Completions-like)
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": full_prompt},
            ],
            temperature=0.2,
        )

        content = completion.choices[0].message.content if completion and completion.choices else ""
        if not content:
            return JSONResponse({"error": "Empty response from model"}, status_code=500)

        # Split markdown and JSON summary
        markdown_part = content
        json_summary: Dict[str, Any] = {}
        if "```json" in content:
            try:
                json_block = content.split("```json", 1)[1].split("```", 1)[0]
                json_summary = json.loads(json_block)
            except Exception:
                json_summary = {}

        # Create output dir and PDF path
        reports_dir = os.path.join(backend_dir, "reports")
        os.makedirs(reports_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"cloudtrail_report_{timestamp}.pdf"
        pdf_path = os.path.join(reports_dir, filename)

        # Render PDF
        _render_markdown_to_pdf(markdown_part, pdf_path)

        return JSONResponse({
            "message": "Report generated",
            "markdown": markdown_part,
            "json_summary": json_summary,
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
