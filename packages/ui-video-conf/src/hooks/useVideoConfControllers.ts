import { useCallback, useState } from 'react';

export const useVideoConfControllers = () => {
  const [controllersConfig, setControllersConfig] = useState({ mic: true, video: false });

  const handleToggleMic = useCallback((): void => {
    setControllersConfig((prevState) => ({ ...prevState, mic: !prevState.mic }));
  }, []);

  const handleToggleVideo = useCallback((): void => {
    setControllersConfig((prevState) => ({ ...prevState, video: !prevState.video }));
  }, []);

  return {
    controllersConfig, handleToggleMic, handleToggleVideo
  }
}
