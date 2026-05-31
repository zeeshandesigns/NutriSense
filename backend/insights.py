"""
Generates plain-language nutritional insights via OpenRouter (Qwen model).
OpenRouter is free-tier compatible and requires no paid subscription.
Model: qwen/qwen-2.5-72b-instruct
"""

import requests

from config import MOCK_MODE, OPENROUTER_API_KEY

OPENROUTER_URL   = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "qwen/qwen-2.5-72b-instruct"

GOAL_CONTEXT = {
    "weight_loss": "The user wants to lose weight — mention calorie density and whether this dish is light or heavy.",
    "muscle_gain": "The user wants to build muscle — focus on protein content and how this dish fits a high-protein diet.",
    "curious":     "The user just wants to understand their food — give a balanced, informative explanation.",
}

SYSTEM_PROMPT = (
    "You are a friendly, culturally-aware nutrition assistant for South Asian cuisine. "
    "Write exactly 2-3 sentences in plain English that: "
    "(1) briefly describe what the dish is and what makes it nutritionally notable, "
    "(2) give one practical insight relevant to the user's goal. "
    "Use a warm, non-judgmental tone. Never call food unhealthy or bad. "
    "Do not mention specific gram weights; use phrases like 'a good source of protein'."
)

_MOCK_INSIGHTS = {
    "muscle_gain": (
        "{dish} is a high-protein staple of Pakistani cuisine, rich in slow-digested "
        "meat that supports muscle recovery. It pairs well with roti or rice for a "
        "complete post-workout meal."
    ),
    "weight_loss": (
        "{dish} is a deeply flavourful South Asian dish. Enjoying a moderate portion "
        "alongside fresh salad is a great way to stay satisfied without overindulging."
    ),
    "curious": (
        "{dish} is a beloved dish in Pakistani and South Asian households, "
        "traditionally slow-cooked to develop rich, layered flavours. "
        "It's a wonderful way to experience the depth of desi cuisine."
    ),
}


def generate_insight(food_label: str, nutrition: dict, user_goal: str = "curious") -> str:
    dish = food_label.replace("_", " ").title()

    if MOCK_MODE:
        template = _MOCK_INSIGHTS.get(user_goal, _MOCK_INSIGHTS["curious"])
        return template.format(dish=dish)

    goal_note = GOAL_CONTEXT.get(user_goal, GOAL_CONTEXT["curious"])
    user_message = (
        f"Food: {dish}\n"
        f"Nutrition per serving: {nutrition.get('calories', '?')} kcal, "
        f"{nutrition.get('protein', '?')}g protein, "
        f"{nutrition.get('carbs', '?')}g carbs, "
        f"{nutrition.get('fat', '?')}g fat\n"
        f"Goal context: {goal_note}\n\n"
        "Write the 2-3 sentence insight now:"
    )

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nutrisense.vercel.app",
        "X-Title": "NutriSense AI",
    }
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_message},
        ],
        "max_tokens": 150,
        "temperature": 0.7,
    }

    try:
        resp = requests.post(OPENROUTER_URL, json=payload, headers=headers, timeout=15)
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"OpenRouter error: {e}")
        return f"{dish} is a popular South Asian dish. Enjoy it as part of a balanced diet."
