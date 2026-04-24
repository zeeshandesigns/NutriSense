import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY       = os.environ["GEMINI_API_KEY"]
SUPABASE_URL         = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
MODEL_PATH           = os.environ.get("MODEL_PATH", "./model.onnx")
CLASS_INDEX_PATH     = os.environ.get("CLASS_INDEX_PATH", "./data/class_index.json")
NUTRITION_DB_PATH    = os.environ.get("NUTRITION_DB_PATH", "./data/nutrition_db.json")
GRADCAM_INDEX_PATH   = os.environ.get("GRADCAM_INDEX_PATH", "./data/gradcam_index.json")
CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", "0.70"))
