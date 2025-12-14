import { usePermission } from '@rocket.chat/ui-contexts';
import { MediaCallProvider as MediaCallProviderBase, MediaCallContext } from '@rocket.chat/ui-voip';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { useHasLicenseModule } from '../hooks/useHasLicenseModule';
import { useVoipWarningModal } from '../hooks/useVoipWarningModal';

const MediaCallProvider = ({ children }: { children: ReactNode }) => {
	const dispatchWarning = useVoipWarningModal();

	const canMakeInternalCall = usePermission('allow-internal-voice-calls');
	const canMakeExternalCall = usePermission('allow-external-voice-calls');

	const { data: hasModule = false } = useHasLicenseModule('teams-voip');

	const unauthorizedContextValue = useMemo(
		() => ({
			state: 'unauthorized' as const,
			onToggleWidget: undefined,
			onEndCall: undefined,
			peerInfo: undefined,
		}),
		[],
	);

	const unlicensedContextValue = useMemo(
		() => ({
			state: 'unlicensed' as const,
			onToggleWidget: dispatchWarning,
			onEndCall: undefined,
			peerInfo: undefined,
		}),
		[dispatchWarning],
	);

	if (!hasModule) {
		return <MediaCallContext.Provider value={unlicensedContextValue}>{children}</MediaCallContext.Provider>;
	}

	if (!canMakeInternalCall && !canMakeExternalCall) {
		return <MediaCallContext.Provider value={unauthorizedContextValue}>{children}</MediaCallContext.Provider>;
	}

	return <MediaCallProviderBase>{children}</MediaCallProviderBase>;
};

export default MediaCallProvider;
