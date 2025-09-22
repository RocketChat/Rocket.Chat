import { usePermission } from '@rocket.chat/ui-contexts';
import { MediaCallProvider as MediaCallProviderBase, MediaCallContext } from '@rocket.chat/ui-voip';

import { useHasLicenseModule } from '../hooks/useHasLicenseModule';
import { useVoipWarningModal } from '../hooks/useVoipWarningModal';

const MediaCallProvider = ({ children }: { children: React.ReactNode }) => {
	const dispatchWarning = useVoipWarningModal();

	const canMakeInternalCall = usePermission('allow-internal-voice-calls');
	const canMakeExternalCall = usePermission('allow-external-voice-calls');

	const hasModule = useHasLicenseModule('teams-voip');

	if (!hasModule) {
		return (
			<MediaCallContext.Provider
				value={{ state: 'unlicensed', onToggleWidget: dispatchWarning, onEndCall: undefined, peerInfo: undefined }}
			>
				{children}
			</MediaCallContext.Provider>
		);
	}

	if (!canMakeInternalCall && !canMakeExternalCall) {
		return (
			<MediaCallContext.Provider value={{ state: 'unauthorized', onToggleWidget: undefined, onEndCall: undefined, peerInfo: undefined }}>
				{children}
			</MediaCallContext.Provider>
		);
	}

	return <MediaCallProviderBase>{children}</MediaCallProviderBase>;
};

export default MediaCallProvider;
