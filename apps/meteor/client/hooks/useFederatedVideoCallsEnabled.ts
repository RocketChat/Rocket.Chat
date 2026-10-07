import { useSetting } from '@rocket.chat/ui-contexts';
import { useVideoConfWindowEnabled } from '@rocket.chat/ui-video-conf';

/**
 * Whether video calls run in native federated rooms: MatrixRTC calls are enabled, and calls run in the conference
 * window, the only client here that joins a MatrixRTC session.
 */
export const useFederatedVideoCallsEnabled = (): boolean => {
	const matrixRTCEnabled = useSetting('Federation_Service_MatrixRTC_Enabled', false);
	const conferenceWindowEnabled = useVideoConfWindowEnabled();

	return matrixRTCEnabled && conferenceWindowEnabled;
};
