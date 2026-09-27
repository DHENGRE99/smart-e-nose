from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import json
from datetime import datetime
import os
import firebase_admin
from firebase_admin import credentials, firestore

app = Flask(__name__)
CORS(app)

model = joblib.load("model.pkl")
shelf_model = joblib.load("shelf_model.pkl")

HISTORY_FILE = "history.json"
latest_live_reading = None
live_history = []  
device_status = {
    "last_seen": None,
    "total_readings": 0,
    "online": False
}

LIVE_HISTORY_MAX = 50  
DEVICE_TIMEOUT_SECONDS = 15  

# Initialize Firebase Admin supporting both Local and Cloud (Render)
try:
    cred_path = "serviceAccountKey.json"
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        firebase_enabled = True
        print("[OK] Firebase initialized successfully using local serviceAccountKey.json")
    else:
        firebase_env = os.environ.get("FIREBASE_CREDENTIALS")
        if firebase_env:
            cred_dict = json.loads(firebase_env)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            firebase_enabled = True
            print("[OK] Firebase initialized successfully using FIREBASE_CREDENTIALS env var")
        else:
            firebase_enabled = False
            print("[Warning] Firebase initialization skipped: Neither local file nor env var found.")
except Exception as e:
    print(f"[Warning] Firebase initialization failed: {e}")
    firebase_enabled = False

if firebase_enabled:
    db = firestore.client()

def load_history():
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r") as f:
            return json.load(f)
    return []

def save_to_history(record):
    history = load_history()
    history.append(record)
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=2)

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Smart E-Nose API is running!",
        "project": "Citrus Freshness Detection - Nagpur",
        "version": "2.0",
        "hardware": "ESP32 + MQ-135 + MQ-4 + MQ-3 + DHT11"
    })

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        mq135 = float(data["mq135"])
        mq4   = float(data["mq4"])
        mq3   = float(data["mq3"])
        temperature = float(data["temperature"])
        humidity    = float(data["humidity"])
        fruit = data.get("fruit", "Orange")

        sensor_input = np.array([[mq135, mq4, mq3, temperature, humidity]])

        status = model.predict(sensor_input)[0]
        shelf_days = int(round(shelf_model.predict(sensor_input)[0]))
        shelf_days = max(0, shelf_days)

        if status == "Fresh":
            advice = "Fruit is fresh. Safe to consume or store."
        elif status == "Medium":
            advice = "Fruit is aging. Use soon or refrigerate."
        else:
            advice = "Fruit is spoiled. Do not consume."

        result = {
            "fruit": fruit,
            "mq135": mq135,
            "mq4": mq4,
            "mq3": mq3,
            "temperature": temperature,
            "humidity": humidity,
            "freshness": status,
            "shelf_life_days": shelf_days,
            "advice": advice,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        save_to_history(result)

        if firebase_enabled:
            try:
                db.collection("citrus_history").add(result)
            except Exception as e:
                print(f"Firebase persistent record save error: {e}")

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/live", methods=["POST"])
def receive_live_data():
    global latest_live_reading, live_history, device_status
    try:
        data = request.get_json()

        mq135 = float(data["mq135"])
        mq4   = float(data["mq4"])
        mq3   = float(data["mq3"])
        temperature = float(data["temperature"])
        humidity    = float(data["humidity"])
        fruit = data.get("fruit", "Orange")

        sensor_input = np.array([[mq135, mq4, mq3, temperature, humidity]])
        status = model.predict(sensor_input)[0]
        shelf_days = max(0, int(round(shelf_model.predict(sensor_input)[0])))

        if status == "Fresh":
            advice = "Fruit is fresh. Safe to consume or store."
            edible = "edible"
        elif status == "Medium":
            advice = "Fruit is aging. Use soon or refrigerate."
            edible = "caution"
        else:
            advice = "Fruit is spoiled. Do not consume."
            edible = "not_edible"

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        latest_live_reading = {
            "fruit": fruit,
            "mq135": mq135,
            "mq4": mq4,
            "mq3": mq3,
            "temperature": temperature,
            "humidity": humidity,
            "freshness": status,
            "shelf_life_days": shelf_days,
            "advice": advice,
            "edible": edible,
            "timestamp": timestamp
        }

        live_history.append(latest_live_reading.copy())
        if len(live_history) > LIVE_HISTORY_MAX:
            live_history = live_history[-LIVE_HISTORY_MAX:]

        device_status["last_seen"] = timestamp
        device_status["total_readings"] += 1
        device_status["online"] = True

        save_to_history(latest_live_reading.copy())

        if firebase_enabled:
            try:
                db.collection("live_readings").add(latest_live_reading)
                db.collection("citrus_history").add(latest_live_reading.copy())
                db.collection("device_status").document("esp32").set(device_status)
            except Exception as e:
                print(f"Firebase write error: {e}")

        return jsonify({
            "message": "Live data received and analyzed",
            "freshness": status,
            "shelf_life_days": shelf_days,
            "advice": advice,
            "edible": edible
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/live", methods=["GET"])
def get_live_data():
    if latest_live_reading is None:
        return jsonify({"connected": False}), 200

    if device_status["last_seen"]:
        last_seen = datetime.strptime(device_status["last_seen"], "%Y-%m-%d %H:%M:%S")
        diff = (datetime.now() - last_seen).total_seconds()
        device_status["online"] = diff < DEVICE_TIMEOUT_SECONDS

    return jsonify({
        "connected": device_status["online"],
        "data": latest_live_reading
    }), 200

@app.route("/live/history", methods=["GET"])
def get_live_history():
    limit = request.args.get("limit", 20, type=int)
    limit = min(limit, LIVE_HISTORY_MAX)
    return jsonify({
        "total": len(live_history),
        "readings": live_history[-limit:]
    }), 200

@app.route("/device/status", methods=["GET"])
def get_device_status():
    if device_status["last_seen"]:
        last_seen = datetime.strptime(device_status["last_seen"], "%Y-%m-%d %H:%M:%S")
        diff = (datetime.now() - last_seen).total_seconds()
        device_status["online"] = diff < DEVICE_TIMEOUT_SECONDS
    else:
        device_status["online"] = False

    return jsonify({
        "device": "ESP32",
        "online": device_status["online"],
        "last_seen": device_status["last_seen"],
        "total_readings": device_status["total_readings"],
        "sensors": {
            "mq135": {"pin": 34, "type": "analog", "desc": "NH₃ / CO₂ / VOCs"},
            "mq4":   {"pin": 35, "type": "analog", "desc": "Methane"},
            "mq3":   {"pin": 4,  "type": "digital", "desc": "Ethanol (trigger)"},
            "dht11": {"pin": 5,  "type": "digital", "desc": "Temperature & Humidity"},
            "buzzer":{"pin": 2,  "type": "output",  "desc": "Alert buzzer"},
            "lcd_sda":{"pin": 21,"type": "i2c",     "desc": "LCD Data"},
            "lcd_scl":{"pin": 22,"type": "i2c",     "desc": "LCD Clock"}
        }
    }), 200

@app.route("/history", methods=["GET"])
def history():
    records = load_history()
    return jsonify({
        "total": len(records),
        "records": records
    }), 200

@app.route("/analytics", methods=["GET"])
def analytics():
    records = load_history()
    if not records:
        return jsonify({"message": "No data yet"}), 200

    total   = len(records)
    fresh   = sum(1 for r in records if r["freshness"] == "Fresh")
    medium  = sum(1 for r in records if r["freshness"] == "Medium")
    spoiled = sum(1 for r in records if r["freshness"] == "Spoiled")

    return jsonify({
        "total_readings": total,
        "fresh_count": fresh,
        "medium_count": medium,
        "spoiled_count": spoiled,
        "fresh_percent": round((fresh / total) * 100, 1),
        "spoiled_percent": round((spoiled / total) * 100, 1)
    }), 200

if __name__ == "__main__":
    print("Starting Smart E-Nose API v2.0...")
    print("Hardware: ESP32 + MQ-135 + MQ-4 + MQ-3 + DHT11")
    print("Endpoints: /predict, /live, /live/history, /device/status, /history, /analytics")
    app.run(debug=True, host="0.0.0.0", port=5000)