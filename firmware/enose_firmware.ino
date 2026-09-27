/*
 * Smart E-Nose Firmware — Cloud Connected ESP32
 * ---------------------------------------------
 * Sensors:
 *   - DHT11 (temp + humidity)          -> GPIO 5
 *   - MQ gas sensor TOP    (analog)    -> GPIO 34 (input-only ADC1)
 *   - MQ gas sensor BOTTOM (analog)    -> GPIO 35 (input-only ADC1)
 *   - MQ BOTTOM digital/trigger (D0)   -> GPIO 4  (LOW when gas > pot threshold)
 *   - 16x2 I2C LCD                     -> SDA 21, SCL 22
 *   - Buzzer                           -> GPIO 2
 *
 * Logic:
 *   - Captures clean-air baseline at boot.
 *   - Every 5s, reads sensors and calculates gasDelta.
 *   - Sends data to Cloud ML API (Flask on Render) via HTTP POST.
 *   - Parses ML freshness verdict from response.
 *   - Updates LCD and triggers buzzer if spoiled.
 *
 * Libraries needed:
 *   - WiFi, HTTPClient (built-in)
 *   - ArduinoJson (by Benoit Blanchon)
 *   - LiquidCrystal I2C (by Frank de Brabander)
 *   - DHT sensor library (by Adafruit)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>

// ==================== CONFIGURATION ====================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Update this to your deployed Render URL or local IP for testing
const char* SERVER_URL    = "http://10.226.128.179/live";
const char* FRUIT_TYPE    = "Orange";

// ---------------- Pin definitions ----------------
#define DHT_PIN        5
#define DHT_TYPE       DHT11
#define BUZZER_PIN     2
#define MQ_TOP_PIN     34
#define MQ_BOT_PIN     35
#define MQ_BOT_DO_PIN  4

// ---------------- Tuning ----------------
#define WARMUP_SECONDS      30
#define BASELINE_SAMPLES    20
#define SEND_INTERVAL_MS    5000  // Send to cloud every 5s
#define PAGE_INTERVAL_MS    3000

// ---------------- Objects ----------------
LiquidCrystal_I2C lcd(0x27, 16, 2);
DHT dht(DHT_PIN, DHT_TYPE);

// ---------------- State ----------------
int   baselineTop = 0;
int   baselineBot = 0;
float temperature = 0;
float humidity    = 0;
int   gasTop      = 0;
int   gasBot      = 0;
int   gasDelta    = 0;
bool  trigActive  = false;

String lastFreshness = "Evaluating...";
int lastShelfDays = -1;
bool serverConnected = false;

unsigned long lastSend = 0;
unsigned long lastPage = 0;
int page = 0;

int readMQ(int pin) {
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(pin);
    delay(2);
  }
  return sum / 10;
}

void beep(int onMs, int offMs, int count) {
  for (int i = 0; i < count; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(onMs);
    digitalWrite(BUZZER_PIN, LOW);
    delay(offMs);
  }
}

void connectWiFi() {
  Serial.printf("Connecting to %s", WIFI_SSID);
  lcd.clear();
  lcd.print("WiFi Connect...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    lcd.clear();
    lcd.print("WiFi Connected!");
  } else {
    Serial.println("\nWiFi FAILED");
    lcd.clear();
    lcd.print("WiFi FAILED!");
  }
  delay(1000);
}

void setup() {
  Serial.begin(115200);

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  pinMode(MQ_BOT_DO_PIN, INPUT);
  
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  dht.begin();

  lcd.setCursor(0, 0);
  lcd.print("Smart E-Nose");
  lcd.setCursor(0, 1);
  lcd.print("Cloud Version");
  beep(80, 80, 2);
  delay(1500);

  connectWiFi();

  // --- MQ warm-up ---
  for (int s = WARMUP_SECONDS; s > 0; s--) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("MQ warming up...");
    lcd.setCursor(0, 1);
    lcd.printf("%d sec left", s);
    delay(1000);
  }

  // --- Clean-air baseline ---
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Calibrating...");
  long sumTop = 0, sumBot = 0;
  for (int i = 0; i < BASELINE_SAMPLES; i++) {
    sumTop += readMQ(MQ_TOP_PIN);
    sumBot += readMQ(MQ_BOT_PIN);
    lcd.setCursor(0, 1);
    lcd.printf("%d/%d", i + 1, BASELINE_SAMPLES);
    delay(250);
  }
  baselineTop = sumTop / BASELINE_SAMPLES;
  baselineBot = sumBot / BASELINE_SAMPLES;

  Serial.printf("Baseline top:%d bottom:%d\n", baselineTop, baselineBot);
  lcd.clear();
  lcd.print("Ready! Add fruit");
  beep(150, 0, 1);
  delay(1500);
  lcd.clear();
}

void sendToBackend() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  
  // Map ADC values to PPM estimate for the ML model
  int mq135_ppm = map(gasTop, 0, 4095, 0, 500);
  int mq4_ppm   = map(gasBot, 0, 4095, 0, 500);
  int mq3_ppm   = trigActive ? 300 : 70;

  StaticJsonDocument<256> doc;
  doc["mq135"] = mq135_ppm;
  doc["mq4"]   = mq4_ppm;
  doc["mq3"]   = mq3_ppm;
  doc["temperature"] = temperature;
  doc["humidity"]    = humidity;
  doc["fruit"]       = FRUIT_TYPE;
  doc["gas_delta"]   = gasDelta;

  String payload;
  serializeJson(doc, payload);
  Serial.printf("Sending to ML Cloud: %s\n", payload.c_str());

  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    String response = http.getString();
    StaticJsonDocument<512> resDoc;
    DeserializationError error = deserializeJson(resDoc, response);

    if (!error && resDoc.containsKey("freshness")) {
      lastFreshness = resDoc["freshness"].as<String>();
      lastShelfDays = resDoc["shelf_life_days"].as<int>();
      serverConnected = true;
      Serial.printf("Result: %s, Shelf: %d days\n", lastFreshness.c_str(), lastShelfDays);
    }
  } else {
    Serial.printf("HTTP Error: %s\n", http.errorToString(httpCode).c_str());
    serverConnected = false;
  }
  http.end();
}

void readSensors() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (!isnan(t)) temperature = t;
  if (!isnan(h)) humidity = h;

  gasTop = readMQ(MQ_TOP_PIN);
  gasBot = readMQ(MQ_BOT_PIN);
  trigActive = (digitalRead(MQ_BOT_DO_PIN) == LOW);

  int dTop = max(0, gasTop - baselineTop);
  int dBot = max(0, gasBot - baselineBot);
  gasDelta = max(dTop, dBot);

  // Send to Cloud API
  sendToBackend();
}

void updateDisplay() {
  lcd.clear();
  if (page == 0) {
    lcd.setCursor(0, 0);
    lcd.printf("T:%.1fC H:%.0f%%", temperature, humidity);
    lcd.setCursor(0, 1);
    if (!serverConnected) {
      lcd.print("API Disconnected");
    } else {
      lcd.print(lastFreshness);
      if (lastShelfDays >= 0) lcd.printf(" %dd", lastShelfDays);
    }
  } else {
    lcd.setCursor(0, 0);
    lcd.printf("GasT:%d B:%d", gasTop, gasBot);
    lcd.setCursor(0, 1);
    lcd.printf("Rise:%d", gasDelta);
    if (trigActive) lcd.print(" TRIG");
  }
}

void loop() {
  unsigned long now = millis();

  // Auto-reconnect WiFi
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (now - lastSend >= SEND_INTERVAL_MS) {
    lastSend = now;
    readSensors();
    
    // Alarm based on Cloud ML Verdict
    if (lastFreshness == "Spoiled") {
      beep(120, 120, 3);
    } else if (lastFreshness == "Medium") {
      beep(60, 0, 1);
    }
  }

  if (now - lastPage >= PAGE_INTERVAL_MS) {
    lastPage = now;
    page = 1 - page;
    updateDisplay();
  }
}
