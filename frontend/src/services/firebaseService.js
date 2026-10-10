import { ref, push, set } from "firebase/database";
import { rtdb } from "../firebase";

export async function saveSensorData(sensorData) {
  try {
    const sensorRef = ref(rtdb, "sensorReadings");

    const newReading = push(sensorRef);

    await set(newReading, {
      mq135: Number(sensorData.mq135),
      mq4: Number(sensorData.mq4),
      mq3: Number(sensorData.mq3),
      temperature: Number(sensorData.temperature),
      humidity: Number(sensorData.humidity),
      timestamp: Date.now(),
    });

    console.log("Sensor data saved to Firebase");

    return true;
  } catch (error) {
    console.error("Firebase error:", error);
    return false;
  }
}