# server/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
import sys

# 1. Initialize API
app = FastAPI()

# 2. CORS (Allow React)
origins = ["http://localhost:5173", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Load the AI Model (Downloads on first run)
# We use a Zero-Shot classifier which is perfect for arbitrary labels
print("⏳ Loading ML Model... (This might take a minute on first run)")
try:
    classifier = pipeline(
        "zero-shot-classification", 
        model="facebook/bart-large-mnli",
        device=-1 # Set to 0 if you have NVIDIA GPU and CUDA installed
    )
    print("✅ Model Loaded Successfully!")
except Exception as e:
    print(f"❌ Model Failed to Load: {e}")
    sys.exit(1)

# 4. Define Labels (The emotions we want to detect)
EMOTION_LABELS = [
    "Calm", "Anxious", "Overwhelmed", 
    "Low", "Focused", "Energized", "Sad"
]

class TextIn(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"status": "MoodScape Brain is Active & Model Loaded"}

@app.post("/predict")
def predict_emotion(data: TextIn):
    if not data.text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # Run Inference
    result = classifier(data.text, EMOTION_LABELS)
    
    # Extract top result
    top_emotion = result['labels'][0]
    confidence = result['scores'][0]
    
    return {
        "emotion": top_emotion,
        "confidence": confidence,
        "all_scores": dict(zip(result['labels'], result['scores']))
    }

class ChatIn(BaseModel):
    text: str
    mood: str

@app.post("/chat")
def chat_reflection(data: ChatIn):
    text = data.text.lower()
    mood = data.mood
    
    # Simple Reflection Logic (No heavy AI required)
    if "why" in text:
        reply = "It's natural to look for reasons. Sometimes feelings just exist."
    elif "tired" in text or "sleep" in text:
        reply = "Rest is productive too. Have you slept well lately?"
    elif "work" in text or "job" in text:
        reply = "Work carries a heavy weight. Remember you are more than your output."
    elif "scared" in text or "afraid" in text:
        reply = "Fear is just a reaction. You are safe right now."
    else:
        # Fallback based on mood
        if mood == "Anxious":
            reply = "Take a breath. That anxiety is trying to protect you, but you are safe."
        elif mood == "Sad":
            reply = "Be gentle with yourself. This feeling is heavy, but it will pass."
        elif mood == "Energized":
            reply = "Hold onto that energy! What is one small thing you can do with it?"
        else:
            reply = "I hear you. Tell me more about that."
            
    return {"reply": reply}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)