from flask import Blueprint, jsonify
from predict import _session, get_class_index

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model_loaded": _session is not None,
        "classes": len(get_class_index()),
    })
