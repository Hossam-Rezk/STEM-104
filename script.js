// Threshold values for sensors
const thresholds = {
  temperature: 30,
  humidity: 60,
  airQuality: 300,
  lightLevel: 500
};

// Set up the temperature chart
const tempCtx = document.getElementById('temperatureChart').getContext('2d');
const tempChart = new Chart(tempCtx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Temperature (°C)',
      data: [],
      borderColor: 'rgba(255, 99, 132, 1)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderWidth: 2,
      fill: true
    }]
  },
  options: {
    responsive: true,
    scales: {
      x: { title: { display: true, text: 'Time' } },
      y: { title: { display: true, text: 'Temperature (°C)' } }
    }
  }
});

// Set up the humidity chart
const humCtx = document.getElementById('humidityChart').getContext('2d');
const humChart = new Chart(humCtx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Humidity (%)',
      data: [],
      borderColor: 'rgba(54, 162, 235, 1)',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderWidth: 2,
      fill: true
    }]
  },
  options: {
    responsive: true,
    scales: {
      x: { title: { display: true, text: 'Time' } },
      y: { title: { display: true, text: 'Humidity (%)' } }
    }
  }
});

// Set up the air quality chart
const mqCtx = document.getElementById('mq135Chart').getContext('2d');
const mqChart = new Chart(mqCtx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Air Quality (ppm)',
      data: [],
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderWidth: 2,
      fill: true
    }]
  },
  options: {
    responsive: true,
    scales: {
      x: { title: { display: true, text: 'Time' } },
      y: { title: { display: true, text: 'Air Quality (ppm)' } }
    }
  }
});

// Set up the light intensity chart
const ldrCtx = document.getElementById('ldrSensorChart').getContext('2d');
const ldrChart = new Chart(ldrCtx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Light Intensity',
      data: [],
      borderColor: 'rgba(153, 102, 255, 1)',
      backgroundColor: 'rgba(153, 102, 255, 0.2)',
      borderWidth: 2,
      fill: true
    }]
  },
  options: {
    responsive: true,
    scales: {
      x: { title: { display: true, text: 'Time' } },
      y: { title: { display: true, text: 'Light Intensity' } }
    }
  }
});

// Function to convert LDR sensor resistance to Lux
function convertToLux(resistance) {
  const lux = 500 / (resistance / 1000);
  return lux.toFixed(2);
}

// Process data received from Arduino
function processArduinoData(data) {
  try {
    // Parse the JSON data
    const parsedData = JSON.parse(data);

    // Get the current time for the x-axis
    const now = new Date().toLocaleTimeString();

    // Update Temperature Chart
    tempChart.data.labels.push(now);
    tempChart.data.datasets[0].data.push(parsedData.temperature);
    tempChart.update();

    // Update Humidity Chart
    humChart.data.labels.push(now);
    humChart.data.datasets[0].data.push(parsedData.humidity);
    humChart.update();

    // Update Air Quality Chart
    mqChart.data.labels.push(now);
    mqChart.data.datasets[0].data.push(parsedData.airQuality);
    mqChart.update();

    // Update Light Intensity Chart (converted to Lux)
    const lightLevelInLux = convertToLux(parsedData.lightLevel);
    ldrChart.data.labels.push(now);
    ldrChart.data.datasets[0].data.push(lightLevelInLux);
    ldrChart.update();

    // Update Stats
    document.getElementById('avg-temp').textContent = `Temperature: ${parsedData.temperature.toFixed(1)} °C`;
    document.getElementById('avg-hum').textContent = `Humidity: ${parsedData.humidity.toFixed(1)} %`;
    document.getElementById('avg-air').textContent = `Air Quality: ${parsedData.airQuality} ppm`;
    document.getElementById('avg-light').textContent = `Light Intensity: ${lightLevelInLux} Lux`;

    // Check thresholds and update warning box with specific sensor info
    const warningElement = document.getElementById('warning');
    let warningMessage = '';
    let isThresholdExceeded = false;

    // Check if temperature exceeds the threshold
    if (parsedData.temperature > thresholds.temperature) {
      warningMessage += `Temperature: ${parsedData.temperature}°C exceeds threshold of ${thresholds.temperature}°C. `;
      isThresholdExceeded = true;
    }

    // Check if humidity exceeds the threshold
    if (parsedData.humidity > thresholds.humidity) {
      warningMessage += `Humidity: ${parsedData.humidity}% exceeds threshold of ${thresholds.humidity}%. `;
      isThresholdExceeded = true;
    }

    // Check if air quality exceeds the threshold
    if (parsedData.airQuality > thresholds.airQuality) {
      warningMessage += `Air Quality: ${parsedData.airQuality}ppm exceeds threshold of ${thresholds.airQuality}ppm. `;
      isThresholdExceeded = true;
    }

    // Check if light level exceeds the threshold
    if (parsedData.lightLevel > thresholds.lightLevel) {
      warningMessage += `Light Intensity: ${lightLevelInLux} Lux exceeds threshold of ${thresholds.lightLevel} Lux. `;
      isThresholdExceeded = true;
    }

    // Display warning message if thresholds are exceeded
    if (isThresholdExceeded) {
      warningElement.style.display = 'block';
      warningElement.textContent = `Warning: ${warningMessage}`;
    } else {
      warningElement.style.display = 'none';
    }

    // Send data to the backend for saving to Excel
    sendDataToBackend(parsedData);

  } catch (error) {
    console.error("Error processing Arduino data:", error.message);
  }
}

// Send data to Python backend to save in the Excel file
function sendDataToBackend(data) {
  fetch('http://localhost:5000/save-data', { // Update this URL if your backend is hosted elsewhere
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
    console.log("Data saved to Excel successfully:", data);
  })
  .catch((error) => {
    console.error("Error sending data to backend:", error);
  });
}

// Connect to Arduino using the Web Serial API
async function connectToArduino() {
  try {
    // Request a port and open it
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });

    // Create a text decoder stream
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();

    let buffer = ""; // Buffer to store incomplete data

    // Read data from the serial port
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        reader.releaseLock();
        break;
      }
      if (value) {
        buffer += value; // Append data to buffer

        // Split the buffer into lines
        const lines = buffer.split("\n");
        buffer = lines.pop(); // Keep incomplete line in buffer

        // Process each complete line
        for (const line of lines) {
          if (line.trim()) {
            processArduinoData(line.trim());
          }
        }
      }
    }
  } catch (error) {
    console.error("Error connecting to Arduino:", error);
  }
}

// Add event listener to the connect button
document.getElementById('connectButton').addEventListener('click', connectToArduino);
