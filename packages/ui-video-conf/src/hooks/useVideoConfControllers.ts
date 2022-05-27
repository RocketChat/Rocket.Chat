import { useCallback, useState } from 'react';

export const useVideoConfControllers = () => {
  const [controllersConfig, setControllersConfig] = useState({ mic: true, cam: false });

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
