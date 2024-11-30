#include <DHT.h>
#include <ArduinoJson.h>

#define DHTPIN 2         // Pin connected to DHT22 data pin
#define DHTTYPE DHT22    // DHT22 sensor
#define BUZZER 3         // Buzzer pin
#define MQ135_PIN A0     // MQ135 sensor analog pin
#define LDR_PIN A1       // LDR analog pin

DHT dht(DHTPIN, DHTTYPE);

// Thresholds
float tempThreshold = 30.0;    // Temperature in Celsius
float humidityThreshold = 60.0; // Humidity in %
int airQualityThreshold = 300; // Air quality in arbitrary units
int lightThreshold = 500;      // Light intensity (analog value)

void setup() {
  Serial.begin(9600);    // Initialize serial communication
  dht.begin();           // Initialize DHT sensor
  pinMode(BUZZER, OUTPUT);
  digitalWrite(BUZZER, LOW);
}

void loop() {
  // Read DHT22 sensor
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  // Read MQ135 sensor
  int airQuality = analogRead(MQ135_PIN);

  // Read LDR sensor
  int lightLevel = analogRead(LDR_PIN);

  // Create a JSON object
  StaticJsonDocument<200> doc;
  doc["temperature"] = isnan(temperature) ? 0 : temperature;
  doc["humidity"] = isnan(humidity) ? 0 : humidity;
  doc["airQuality"] = airQuality;
  doc["lightLevel"] = lightLevel;

  // Send JSON data via Serial
  serializeJson(doc, Serial);
  Serial.println(); // End JSON object with a newline for easier parsing

  // Check thresholds and control buzzer
  if (temperature > tempThreshold || 
      humidity > humidityThreshold || 
      airQuality > airQualityThreshold || 
      lightLevel < lightThreshold) {
    digitalWrite(BUZZER, HIGH); // Turn buzzer on
  } else {
    digitalWrite(BUZZER, LOW);  // Turn buzzer off
  }

  delay(2000); // Wait 2 seconds before the next loop
}
