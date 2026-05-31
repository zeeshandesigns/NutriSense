import os
from dotenv import load_dotenv

load_dotenv()

# Set MOCK_MODE=true to run without a trained model (for development)
MOCK_MODE = os.environ.get("MOCK_MODE", "false").lower() == "true"

# OpenRouter API key (free tier, Qwen model)
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
if not OPENROUTER_API_KEY and not MOCK_MODE:
    raise RuntimeError(
        "OPENROUTER_API_KEY is required. Set it in backend/.env or enable MOCK_MODE=true."
    )

SUPABASE_URL         = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

# Paths — default to ../data/ when running from backend/
MODEL_PATH           = os.environ.get("MODEL_PATH",        "../model.onnx")
CLASS_INDEX_PATH     = os.environ.get("CLASS_INDEX_PATH",  "../data/class_index.json")
NUTRITION_DB_PATH    = os.environ.get("NUTRITION_DB_PATH", "../data/nutrition_db.json")
GRADCAM_INDEX_PATH   = os.environ.get("GRADCAM_INDEX_PATH","../data/gradcam_index.json")
CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", "0.70"))
