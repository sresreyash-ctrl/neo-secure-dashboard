# Neo Secure Dashboard

A comprehensive security dashboard for running and monitoring attack simulations using the Neova ApexRed framework.

## Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- pip (Python package manager)
- AWS CLI configured with appropriate credentials
- OpenAI API key

## Quick Start

### 1. Frontend Setup

Navigate to the main project directory and install dependencies:

```bash
cd neo-secure-dashboard
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port shown in your terminal).

### 2. Backend Setup

Open a new terminal and navigate to the backend directory:

```bash
cd neova-apexred
```

Install Python dependencies:

```bash
pip install -r backend/requirements.txt
```

Start the backend server:

```bash
uvicorn backend.main:app --reload
```

The backend API will be available at `http://localhost:8000`.

## Configuration

### 1. AWS Configuration

1. Open the dashboard in your browser
2. Navigate to the **Settings** page
3. In the **AWS Credentials** section, configure your AWS access key and secret key
4. Save the configuration

### 2. Product Onboarding

1. Go to the **Onboard Product** section
2. Set your OpenAI API key
3. Submit the configuration

## Usage

### Running Attack Simulations

1. Navigate to the **Attack Library** section
2. Select the attack technique you want to simulate
3. Click **Run Attack** to execute the simulation
4. Monitor the attack progress in real-time

### Downloading Reports

1. After a successful attack simulation
2. Click the **Download Report** button
3. The attack detection report will be downloaded as a PDF

## Project Structure

```
neo-secure-dashboard/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── pages/             # Application pages
│   └── lib/               # Utility functions
├── neova-apexred/         # Backend Go application
│   ├── backend/           # Python FastAPI backend
│   ├── v2/                # Go attack techniques
│   └── docs/              # Documentation
└── public/                # Static assets
```

## Features

- **Attack Simulation**: Run various attack techniques against AWS, Azure, GCP, and Kubernetes environments
- **Real-time Monitoring**: Track attack progress and results in real-time
- **Report Generation**: Generate detailed PDF reports of attack detections
- **Multi-cloud Support**: Support for AWS, Azure, GCP, and Kubernetes attack techniques
- **Modern UI**: Clean and intuitive dashboard interface

## Troubleshooting

### Common Issues

1. **Port conflicts**: If ports 5173 or 8000 are in use, the applications will automatically use the next available port
2. **AWS credentials**: Ensure your AWS credentials have the necessary permissions for the attack techniques
3. **OpenAI API**: Verify your OpenAI API key is valid and has sufficient credits

### Getting Help

If you encounter any issues:

1. Check the console logs in your browser's developer tools
2. Review the backend logs in the terminal running the uvicorn server
3. Ensure all dependencies are properly installed
4. Verify your AWS and OpenAI configurations

## Security Notice

This tool is designed for authorized security testing and red team exercises. Only use it on systems you own or have explicit permission to test. Unauthorized use may violate laws and terms of service.

## License

Please refer to the LICENSE file in the neova-apexred directory for licensing information.
