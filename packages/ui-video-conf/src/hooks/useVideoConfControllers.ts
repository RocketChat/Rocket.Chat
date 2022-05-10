import React, { useState } from 'react';

export const useVideoConfControllers = () => {
  const [controllersConfig, setControllersConfig] = useState({ mic: true, video: false });

  const handleToggleMic = (): void => {
    setControllersConfig((prevState) => ({ ...prevState, mic: !controllersConfig.mic }));
  };

  const handleToggleVideo = (): void => {
    setControllersConfig((prevState) => ({ ...prevState, video: !controllersConfig.video }));
  };

  return {
    controllersConfig, handleToggleMic, handleToggleVideo
  }
}
