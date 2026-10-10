
import { ref, onValue } from "firebase/database";
import { rtdb } from "../firebase";

export function listenToLiveReadings(callback, onError) {
  const readingsRef = ref(rtdb, "live_readings/current");

  return onValue(
    readingsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("Firebase live-reading error:", error);
      if (onError) onError(error);
    }
  );
}
