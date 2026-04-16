import { Emitter } from '@rocket.chat/emitter';
import { usePermission } from '@rocket.chat/ui-contexts';
import { MediaCallProvider as MediaCallProviderBase, MediaCallInstanceContext } from '@rocket.chat/ui-voip';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { useHasLicenseModule } from '../hooks/useHasLicenseModule';

const MediaCallProvider = ({ children }: { children: ReactNode }) => {
	const canMakeInternalCall = usePermission('allow-internal-voice-calls');
	const canMakeExternalCall = usePermission('allow-external-voice-calls');

	const { data: hasModule = false } = useHasLicenseModule('teams-voip');

	const unauthorizedContextValue = useMemo(
		() => ({
			inRoomView: false,
			setInRoomView: () => undefined,
			instance: undefined,
			signalEmitter: new Emitter<any>(),
			audioElement: undefined,
			openRoomId: undefined,
			setOpenRoomId: () => undefined,
			getAutocompleteOptions: () => Promise.resolve([]),
		}),
		[],
	);

	if (!hasModule || (!canMakeInternalCall && !canMakeExternalCall)) {
		return <MediaCallInstanceContext.Provider value={unauthorizedContextValue}>{children}</MediaCallInstanceContext.Provider>;
	}

	return <MediaCallProviderBase>{children}</MediaCallProviderBase>;
};

export default MediaCallProvider;
