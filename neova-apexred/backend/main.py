import os
import subprocess
from fastapi import FastAPI, Body
from fastapi.responses import JSONResponse
import logging
import time
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # you can restrict to ["http://localhost:3000"] if React runs there
    allow_credentials=True,
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

@app.post('/attack/cloudtrail-stop')
def attack_cloudtrail_stop():
    logging.info('POST /attack/cloudtrail-stop called.')
    ensure_stratus_built()
    # Set AWS_REGION environment variable for subprocesses
    env = os.environ.copy()
    env['AWS_REGION'] = 'us-east-1'
    logging.info('Set AWS_REGION to us-east-1 for subprocesses.')
    logging.info('Running warmup for aws.defense-evasion.cloudtrail-stop.')
    warmup_result = subprocess.run([EXE_PATH, 'warmup', 'aws.defense-evasion.cloudtrail-stop'], cwd=V2_DIR, capture_output=True, text=True, env=env)
    logging.info('Warmup stdout: %s', warmup_result.stdout)
    logging.info('Warmup stderr: %s', warmup_result.stderr)
    logging.info('Running detonate for aws.defense-evasion.cloudtrail-stop.')
    detonate_result = subprocess.run([EXE_PATH, 'detonate', 'aws.defense-evasion.cloudtrail-stop'], cwd=V2_DIR, capture_output=True, text=True, env=env)
    logging.info('Detonate stdout: %s', detonate_result.stdout)
    logging.info('Detonate stderr: %s', detonate_result.stderr)
    logging.info('Waiting for 2 minutes before cleanup.')
    time.sleep(120)
    logging.info('Running cleanup for aws.defense-evasion.cloudtrail-stop.')
    cleanup_result = subprocess.run([EXE_PATH, 'cleanup', 'aws.defense-evasion.cloudtrail-stop'], cwd=V2_DIR, capture_output=True, text=True, env=env)
    logging.info('Cleanup stdout: %s', cleanup_result.stdout)
    logging.info('Cleanup stderr: %s', cleanup_result.stderr)
    return JSONResponse({
        'warmup_output': warmup_result.stdout,
        'warmup_error': warmup_result.stderr,
        'detonate_output': detonate_result.stdout,
        'detonate_error': detonate_result.stderr,
        'cleanup_output': cleanup_result.stdout,
        'cleanup_error': cleanup_result.stderr,
    })

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