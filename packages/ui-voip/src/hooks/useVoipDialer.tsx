import { useVoipAPI } from './useVoipAPI';
import { useVoipEvent } from './useVoipEvent';

export const useVoipDialer = () => {
	const { openDialer, closeDialer } = useVoipAPI();
	const { open } = useVoipEvent('dialer', { open: false });

	return {
		open,
		openDialer: openDialer || (() => undefined),
		closeDialer: closeDialer || (() => undefined),
	};
};
