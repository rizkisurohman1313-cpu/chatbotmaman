import os
import warnings
import requests as http_requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Suppress deprecation warnings
warnings.filterwarnings("ignore", category=FutureWarning)

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# ============================================================
# Load All API Keys
# ============================================================
GOOGLE_KEY       = os.getenv("API_GOOGLE_KEY", "")
GROQ_KEY         = os.getenv("GROQ_API_KEY", "")
NVIDIA_KEY       = os.getenv("NVIDIA_API_KEY", "")
OPENROUTER_KEY   = os.getenv("OPENROUTER_API_KEY", "")
COHERE_KEY       = os.getenv("COHERE_API_KEY", "")
HUGGINGFACE_KEY  = os.getenv("HUGGINGFACE_API_KEY", "")

# ============================================================
# Read System Prompt
# ============================================================
try:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(script_dir, "system_prompt.txt")
    if not os.path.exists(prompt_path):
        prompt_path = os.path.join(script_dir, "..", "system_prompt.txt")
    with open(prompt_path, "r", encoding="utf-8") as f:
        SYSTEM_PROMPT = f.read()
    print("[OK] System prompt loaded.")
except Exception as e:
    print(f"[WARN] Error reading system prompt: {e}")
    SYSTEM_PROMPT = "Anda adalah asisten AI yang membantu menjawab pertanyaan terkait basis data SQL dan JavaScript."

# ============================================================
# Universal Session Store: {session_id: [{"role": "user/assistant", "content": "..."}]}
# ============================================================
sessions = {}

# ============================================================
# ENGINE 1: Google Gemini
# ============================================================
def call_gemini(history, system_prompt):
    if not GOOGLE_KEY:
        raise Exception("Gemini API Key tidak tersedia.")
    import google.generativeai as genai
    genai.configure(api_key=GOOGLE_KEY)
    model = genai.GenerativeModel(
        model_name="gemini-3.5-flash",
        system_instruction=system_prompt
    )
    gemini_history = []
    for msg in history[:-1]:
        gemini_history.append({
            "role": "user" if msg["role"] == "user" else "model",
            "parts": [msg["content"]]
        })
    chat = model.start_chat(history=gemini_history)
    response = chat.send_message(history[-1]["content"])
    print("[OK] [Mesin 1] Gemini berhasil menjawab.")
    return response.text

# ============================================================
# ENGINE 2: Groq (LLaMA-3 70B - Ultra Fast)
# ============================================================
def call_groq(history, system_prompt):
    if not GROQ_KEY:
        raise Exception("Groq API Key tidak tersedia.")
    from groq import Groq
    client = Groq(api_key=GROQ_KEY)
    messages = [{"role": "system", "content": system_prompt}] + history
    response = client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=messages,
        max_tokens=2048,
        temperature=0.7,
    )
    print("[OK] [Mesin 2] Groq berhasil menjawab.")
    return response.choices[0].message.content

# ============================================================
# ENGINE 3: NVIDIA NIM (LLaMA-3 70B via NVIDIA Inference)
# ============================================================
def call_nvidia(history, system_prompt):
    if not NVIDIA_KEY:
        raise Exception("NVIDIA API Key tidak tersedia.")
    from openai import OpenAI
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=NVIDIA_KEY
    )
    messages = [{"role": "system", "content": system_prompt}] + history
    response = client.chat.completions.create(
        model="meta/llama-3.1-70b-instruct",
        messages=messages,
        max_tokens=2048,
        temperature=0.7,
    )
    print("[OK] [Mesin 3] NVIDIA NIM berhasil menjawab.")
    return response.choices[0].message.content

# ============================================================
# ENGINE 4: OpenRouter (Gemma-2 9B Free)
# ============================================================
def call_openrouter(history, system_prompt):
    if not OPENROUTER_KEY:
        raise Exception("OpenRouter API Key tidak tersedia.")
    from openai import OpenAI
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_KEY,
    )
    messages = [{"role": "system", "content": system_prompt}] + history
    response = client.chat.completions.create(
        model="meta-llama/llama-3.1-8b-instruct:free",
        messages=messages,
        max_tokens=2048,
        temperature=0.7,
    )
    print("[OK] [Mesin 4] OpenRouter berhasil menjawab.")
    return response.choices[0].message.content

# ============================================================
# ENGINE 5: Cohere (Command-R)
# ============================================================
def call_cohere(history, system_prompt):
    if not COHERE_KEY:
        raise Exception("Cohere API Key tidak tersedia.")
    import cohere
    co = cohere.ClientV2(api_key=COHERE_KEY)
    messages = [{"role": "system", "content": system_prompt}] + history
    response = co.chat(
        model="command-r",
        messages=messages,
        max_tokens=2048,
    )
    print("[OK] [Mesin 5] Cohere berhasil menjawab.")
    return response.message.content[0].text

# ============================================================
# ENGINE 6: Hugging Face Serverless (Mistral-7B)
# ============================================================
def call_huggingface(history, system_prompt):
    if not HUGGINGFACE_KEY:
        raise Exception("Hugging Face API Key tidak tersedia.")
    prompt = f"<s>[INST] {system_prompt} [/INST]</s>"
    for msg in history:
        if msg["role"] == "user":
            prompt += f"<s>[INST] {msg['content']} [/INST]"
        else:
            prompt += f" {msg['content']} </s>"

    api_url = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3"
    headers = {"Authorization": f"Bearer {HUGGINGFACE_KEY}"}
    payload = {
        "inputs": prompt,
        "parameters": {"max_new_tokens": 1024, "temperature": 0.7, "return_full_text": False}
    }
    res = http_requests.post(api_url, headers=headers, json=payload, timeout=30)
    if res.status_code != 200:
        raise Exception(f"Hugging Face error {res.status_code}: {res.text}")
    result = res.json()
    print("[OK] [Mesin 6] Hugging Face berhasil menjawab.")
    return result[0]["generated_text"].strip()

# ============================================================
# FALLBACK ORCHESTRATOR: Mencoba semua 6 mesin secara berurutan
# ============================================================
ENGINES = [
    ("Gemini",       call_gemini),
    ("Groq",         call_groq),
    ("NVIDIA NIM",   call_nvidia),
    ("OpenRouter",   call_openrouter),
    ("Cohere",       call_cohere),
    ("Hugging Face", call_huggingface),
]

def generate_response_with_fallback(history, system_prompt):
    """
    Mencoba setiap mesin secara berurutan dengan system prompt dinamis.
    Mesin berikutnya akan digunakan jika mesin sebelumnya gagal/limit.
    """
    last_error = None
    for name, engine_fn in ENGINES:
        try:
            print(f"[TRY] Mencoba Mesin: {name}...")
            return engine_fn(history, system_prompt)
        except Exception as e:
            last_error = e
            print(f"[ERR] Mesin {name} gagal: {e}. Mencoba mesin berikutnya...")
            continue

    raise Exception(f"Semua 6 mesin gagal. Error terakhir: {last_error}")

# ============================================================
# API ROUTES
# ============================================================
@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    active_engines = [name for name, _ in ENGINES if (
        (name == "Gemini" and GOOGLE_KEY) or
        (name == "Groq" and GROQ_KEY) or
        (name == "NVIDIA NIM" and NVIDIA_KEY) or
        (name == "OpenRouter" and OPENROUTER_KEY) or
        (name == "Cohere" and COHERE_KEY) or
        (name == "Hugging Face" and HUGGINGFACE_KEY)
    )]
    return jsonify({
        "status": "ok",
        "active_engines": active_engines,
        "total_engines": len(active_engines)
    })

# ============================================================
# Dynamic System Prompt Builder
# ============================================================
TONE_INSTRUCTIONS = {
    "formal": (
        "Gunakan bahasa Indonesia yang FORMAL, profesional, dan terstruktur. "
        "Sapa pengguna dengan 'Anda'. Gunakan kalimat lengkap dan sopan. "
        "Gaya bahasa seperti asisten dosen atau senior developer."
    ),
    "santai": (
        "Gunakan bahasa Indonesia yang SANTAI, akrab, dan friendly. "
        "Boleh pakai kata 'kamu', 'kita', 'nih', 'dong', 'sih', 'yuk'. "
        "Tetap informatif dan membantu, tapi terasa seperti ngobrol dengan teman yang ahli."
    ),
    "jaksel": (
        "Gunakan gaya bahasa Anak Jakarta Selatan (Jaksel) yang campur antara bahasa Indonesia dan Inggris. "
        "Gunakan kata-kata seperti 'literally', 'which is', 'basically', 'honestly', 'so', 'i mean', 'actually'. "
        "Tetap informatif tapi terasa fun dan relatable. Contoh: 'Jadi basically, yang kamu harus lakuin tuh literally gampang banget, which is...'"
    ),
}

TOPIC_INSTRUCTIONS = {
    "database": (
        "Fokus pada topik BASIS DATA. Spesialisasi pada SQL Server (T-SQL) dan SQLite. "
        "Selalu berikan contoh query SQL yang bisa langsung digunakan. "
        "Domain: JOIN, agregat, CASE, subquery, indexing, stored procedure."
    ),
    "frontend": (
        "Fokus pada topik FRONTEND & JAVASCRIPT. Spesialisasi pada manipulasi JSON, "
        "async/await, fetch API, integrasi REST API, dan pengelolaan state. "
        "Selalu berikan contoh kode JavaScript/TypeScript yang praktis."
    ),
    "edukasi": (
        "Fokus pada EDUKASI UMUM seputar pemrograman dan teknologi informasi. "
        "Gunakan analogi sederhana dan pendekatan yang sangat ramah pemula. "
        "Pecah konsep rumit menjadi bagian kecil yang mudah dipahami."
    ),
    "kesehatan": (
        "Fokus pada HEALTH TECH & KESEHATAN. Gunakan studi kasus seputar rekam medis, "
        "data pasien, sistem rumah sakit, dan analitik kesehatan. "
        "Buat contoh query/kode berbasis data pasien dan jadwal dokter."
    ),
    "hobi": (
        "Fokus pada HOBI & GAME. Gunakan analogi dari dunia gaming RPG, e-sports, "
        "musik, olahraga, atau hobi populer lainnya. "
        "Buat contoh database atau kode yang relevan dengan konteks hobi dan game."
    ),
}

def get_dynamic_system_prompt(tone="formal", topic="database"):
    """Build a dynamic system prompt from base + tone + topic instructions."""
    tone_instr  = TONE_INSTRUCTIONS.get(tone,  TONE_INSTRUCTIONS["formal"])
    topic_instr = TOPIC_INSTRUCTIONS.get(topic, TOPIC_INSTRUCTIONS["database"])
    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"=== INSTRUKSI GAYA BAHASA AKTIF ===\n{tone_instr}\n\n"
        f"=== INSTRUKSI TOPIK AKTIF ===\n{topic_instr}"
    )

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    if not data or "message" not in data:
        return jsonify({"error": "Message is required"}), 400

    user_message = data["message"]
    session_id   = data.get("session_id", "default")
    tone         = data.get("tone",  "formal")
    topic        = data.get("topic", "database")

    # Build dynamic system prompt based on user preferences
    dynamic_prompt = get_dynamic_system_prompt(tone, topic)

    # Append user message to session history
    if session_id not in sessions:
        sessions[session_id] = []
    sessions[session_id].append({"role": "user", "content": user_message})

    try:
        # Try all 6 engines with fallback (pass dynamic_prompt)
        reply = generate_response_with_fallback(sessions[session_id], dynamic_prompt)

        # Save assistant reply to session history
        sessions[session_id].append({"role": "assistant", "content": reply})

        return jsonify({"response": reply, "session_id": session_id, "tone": tone, "topic": topic})

    except Exception as e:
        sessions[session_id].pop()
        print(f"Semua mesin gagal: {e}")
        return jsonify({"error": f"Semua server AI sedang tidak tersedia. Coba lagi dalam beberapa menit. ({str(e)[:100]})"}), 503

@app.route("/api/reset", methods=["POST"])
def reset():
    """Reset a chat session."""
    data = request.json or {}
    session_id = data.get("session_id", "default")
    if session_id in sessions:
        del sessions[session_id]
    return jsonify({"status": "reset"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
