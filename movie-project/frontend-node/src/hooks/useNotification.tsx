import { useState } from "react";

const useNotification = function () {
  // Notification message alerts state
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    const soundTimeout = setTimeout(() => {
      setNotification(null);
    }, 3500);
    return () => clearTimeout(soundTimeout);
  };
  return { notification, showNotification };
};
export default useNotification;
