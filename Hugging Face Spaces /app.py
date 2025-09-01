import gradio as gr
import numpy as np
from tensorflow.keras.models import load_model
import joblib
import tldextract
import re
import validators

# Load trained model and scaler
model = load_model("phishing_model.h5")
scaler = joblib.load("scaler.pkl")

# Function to extract numeric features from URL
def extract_features(url):
    features = {}
    # Validate URL
    if not validators.url(url):
        raise ValueError("Invalid URL")

    features["URLLength"] = len(url)
    
    domain_info = tldextract.extract(url)
    domain = f"{domain_info.subdomain}.{domain_info.domain}.{domain_info.suffix}"
    features["DomainLength"] = len(domain)
    
    features["IsDomainIP"] = int(bool(re.match(r"\d+\.\d+\.\d+\.\d+", domain_info.domain)))
    
    features["NoOfSubDomain"] = len(domain_info.subdomain.split(".")) if domain_info.subdomain else 0
    features["NoOfLettersInURL"] = len(re.findall(r"[a-zA-Z]", url))
    features["NoOfDegitsInURL"] = len(re.findall(r"\d", url))
    features["NoOfEqualsInURL"] = url.count("=")
    features["NoOfQMarkInURL"] = url.count("?")
    features["NoOfAmpersandInURL"] = url.count("&")
    features["NoOfOtherSpecialCharsInURL"] = len(re.findall(r"[!@#$%^&*(),;:]", url))
    
    # For simplicity, fill remaining numeric features as zeros
    # You can add more sophisticated feature extraction here
    for col in range(50):
        features.setdefault(f"feature_{col}", 0)
    
    return features

# Prediction function
def predict_url(url):
    try:
        features_dict = extract_features(url)
        feature_list = list(features_dict.values())
        features_array = np.array([feature_list])
        features_scaled = scaler.transform(features_array)
        prediction = model.predict(features_scaled)
        return "Phishing" if prediction[0][0] > 0.5 else "Legitimate"
    except Exception as e:
        return f"Error: {e}"

# Gradio interface
interface = gr.Interface(
    fn=predict_url,
    inputs=gr.Textbox(label="Enter URL"),
    outputs=gr.Textbox(label="Prediction"),
    title="Phishing URL Detector",
    description="Enter a URL to detect if it's phishing or legitimate."
)

interface.launch()

