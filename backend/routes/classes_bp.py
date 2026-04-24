from flask import Blueprint, jsonify
from predict import get_class_index

classes_bp = Blueprint("classes", __name__)


@classes_bp.route("/classes", methods=["GET"])
def classes():
    return jsonify(get_class_index())
