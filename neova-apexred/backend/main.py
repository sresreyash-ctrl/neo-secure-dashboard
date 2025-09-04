import os
import json
import subprocess
from fastapi import FastAPI, Body
from fastapi.responses import JSONResponse
import logging
import time
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

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