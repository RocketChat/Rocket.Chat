import { useCallback, useState } from 'react';

type controllersConfigProps = {
	mic?: boolean;
	cam?: boolean;
};

export const useVideoConfControllers = (
	initialPreferences: controllersConfigProps = { mic: true, cam: false },
): { controllersConfig: controllersConfigProps; handleToggleMic: () => void; handleToggleCam: () => void } => {
	const [controllersConfig, setControllersConfig] = useState(initialPreferences);

	const handleToggleMic = useCallback(() => setControllersConfig((prevState) => ({ ...prevState, mic: !prevState.mic })), []);

	const handleToggleCam = useCallback(() => setControllersConfig((prevState) => ({ ...prevState, cam: !prevState.cam })), []);

	return {
		controllersConfig,
		handleToggleMic,
		handleToggleCam,
	};
};
