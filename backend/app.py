import os
# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify
from flask_cors import CORS
# pyrefly: ignore [missing-import]
import google.generativeai as genai
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Enable CORS for React frontend (usually runs on port 5173 for Vite)
CORS(app)

# Configure Gemini API
API_KEY = os.getenv("API_GOOGLE_KEY")
if API_KEY and API_KEY != "your_google_api_key_here":
    genai.configure(api_key=API_KEY)
else:
    print("WARNING: API_GOOGLE_KEY is not set or is still the default value.")

# Read System Prompt
try:
    with open("../system_prompt.txt", "r", encoding="utf-8") as f:
        SYSTEM_PROMPT = f.read()
except Exception as e:
    print(f"Error reading system prompt: {e}")
    SYSTEM_PROMPT = "Anda adalah asisten AI yang membantu menjawab pertanyaan terkait basis data."

# Initialize the model with the system instruction
# Using gemini-flash-latest to see if it bypasses the specific quota block
model = genai.GenerativeModel(
    model_name="gemini-flash-latest",
    system_instruction=SYSTEM_PROMPT
)

# Store chat sessions in memory (for demonstration purposes)
# In production, use a database or handle sessions via the frontend
sessions = {}

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    if not data or "message" not in data:
        return jsonify({"error": "Message is required"}), 400

    user_message = data["message"]
    session_id = data.get("session_id", "default")
    
    if not API_KEY or API_KEY == "your_google_api_key_here":
         return jsonify({"error": "Google API Key is not configured on the backend."}), 500

    try:
        # Get or create chat session
        if session_id not in sessions:
            sessions[session_id] = model.start_chat(history=[])
        
        chat_session = sessions[session_id]
        
        # Send message to Gemini
        response = chat_session.send_message(user_message)
        
        return jsonify({
            "response": response.text,
            "session_id": session_id
        })
    except Exception as e:
        print(f"Error during chat: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
