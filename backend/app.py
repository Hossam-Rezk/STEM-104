from flask import Flask, request, jsonify
import pandas as pd
import os
from datetime import datetime

app = Flask(__name__)

# Define the path for the Excel file
EXCEL_FILE_PATH = 'backend/sensor_data.xlsx'

# Check if the Excel file exists, if not, create it with headers
if not os.path.exists(EXCEL_FILE_PATH):
    df = pd.DataFrame(columns=["Timestamp", "Temperature", "Humidity", "Air Quality", "Light Intensity"])
    df.to_excel(EXCEL_FILE_PATH, index=False)

@app.route('/save-data', methods=['POST'])
def save_data():
    try:
        # Get the JSON data from the frontend
        data = request.get_json()

        # Extract values from the received data
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        temperature = data['temperature']
        humidity = data['humidity']
        air_quality = data['airQuality']
        light_intensity = data['lightLevel']

        # Create a new DataFrame row
        new_data = pd.DataFrame([{
            "Timestamp": timestamp,
            "Temperature": temperature,
            "Humidity": humidity,
            "Air Quality": air_quality,
            "Light Intensity": light_intensity
        }])

        # Append the new data to the existing Excel file
        with pd.ExcelWriter(EXCEL_FILE_PATH, engine='openpyxl', mode='a', if_sheet_exists='overlay') as writer:
            new_data.to_excel(writer, index=False, header=False, startrow=writer.sheets['Sheet1'].max_row)

        return jsonify({"status": "success", "message": "Data saved successfully"}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
