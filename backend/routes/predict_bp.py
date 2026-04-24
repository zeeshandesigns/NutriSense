from flask import Blueprint, jsonify, request

from gradcam_api import get_gradcam_url
from insights import generate_insight
from nutrition import get_nutrition
from predict import run_inference

predict_bp = Blueprint("predict", __name__)


@predict_bp.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image file in request"}), 400

    image_bytes = request.files["image"].read()
    if not image_bytes:
        return jsonify({"error": "Empty image file"}), 400

    user_goal = request.form.get("user_goal", "curious")

    result    = run_inference(image_bytes)
    food_label = result["top_prediction"]["label"]
    nutrition  = get_nutrition(food_label)
    insight    = generate_insight(food_label, nutrition, user_goal)

    response = {**result, "nutrition": nutrition, "insight": insight}

    url = get_gradcam_url(food_label)
    if url:
        response["gradcam_sample_url"] = url

    return jsonify(response)
