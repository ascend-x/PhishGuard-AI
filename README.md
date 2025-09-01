# PhishGuard AI  

![Status](https://img.shields.io/badge/status-active-brightgreen)  

## Overview  
PhishGuard AI is an **open-source, AI-powered phishing detection system** hosted on [Hugging Face](https://huggingface.co/spaces/ascend-x/phishing_detector) with a lightweight **browser extension** for real-time protection. It uses **cloud-based AI analysis** to detect phishing attempts in emails, URLs, and websites before harm occurs.  

## Novelty  
- **56-Feature Analysis** – Evaluates URLs using 56 parameters like domain age, entropy, URL length, SSL validity, suspicious keywords, and more.  
- **AI-Enhanced Threat Detection** – Goes beyond blacklists with ML-based risk analysis.  
- **Cloud-Powered Processing** – Performs computations on secure cloud servers for fast detection.  
- **Seamless Browser Integration** – Lightweight extension with minimal performance impact.  
- **Adaptive Learning** – Continuously improves with new threat data.  

## How It Works  
1. The browser extension captures the URL or web content.  
2. 56 features are extracted for risk assessment.  
3. Data is sent securely to the Hugging Face-hosted AI model.  
4. The model predicts phishing probability and returns a response.  
5. The extension blocks or warns users accordingly.  

## 56 Features Used for Detection  
The model uses structural, lexical, and security-based features such as:  
- URL length, domain age, entropy of URL  
- Presence of IP address in URL  
- HTTPS/SSL certificate validity  
- Number of dots, hyphens, suspicious patterns  
- WHOIS registration info (age, validity)  
- Presence of phishing keywords (e.g., "login", "verify")  
- Redirect count and presence of shortened URLs  
- And 48+ additional attributes for fine-grained detection  

## Tech Stack  
- **Frontend (Extension):** JavaScript, HTML, CSS  
- **Backend (Cloud):** Python, FastAPI/Flask  
- **AI Models:** PyTorch / TensorFlow hosted on Hugging Face Spaces  

## Deployment on Hugging Face  
The AI model is deployed on Hugging Face Spaces for real-time inference.  

### API Example
```python
import requests

API_URL = "https://huggingface.co/spaces/ascend-x/phishing_detector"
data = {"url": "http://suspicious-site.com"}

response = requests.post(API_URL, json=data)
print(response.json())
