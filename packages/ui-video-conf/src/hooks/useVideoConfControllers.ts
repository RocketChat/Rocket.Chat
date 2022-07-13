import { useCallback, useState } from 'react';

export const useVideoConfControllers = (initialPreferences: { mic?: boolean; cam?: boolean } = { mic: true, cam: false }) => {
  const [controllersConfig, setControllersConfig] = useState(initialPreferences);

  const handleToggleMic = useCallback((): void => {
    setControllersConfig((prevState) => ({ ...prevState, mic: !prevState.mic }));
  }, []);

  const handleToggleCam = useCallback((): void => {
    setControllersConfig((prevState) => ({ ...prevState, cam: !prevState.cam }));
  }, []);

  return {
    controllersConfig, handleToggleMic, handleToggleCam
  }
}
