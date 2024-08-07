import useVoiceCallAPI from './useVoiceCallAPI';
import useVoiceCallEvent from './useVoiceCallEvent';

export const useVoiceCallDialer = () => {
	const { openDialer, closeDialer } = useVoiceCallAPI();
	const { open } = useVoiceCallEvent('dialer', { open: false });

	return {
		open,
		openDialer: openDialer || (() => undefined),
		closeDialer: closeDialer || (() => undefined),
	};
};

export default useVoiceCallDialer;
