import { Emitter } from '@rocket.chat/emitter';
import { usePermission } from '@rocket.chat/ui-contexts';
import { MediaCallProvider as MediaCallProviderBase, MediaCallInstanceContext } from '@rocket.chat/ui-voip';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { useHasLicenseModule } from '../hooks/useHasLicenseModule';
import LiveKitMediaCallProvider from '../views/room/body/GroupCallView/LiveKitMediaCallProvider';

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

	// LiveKitMediaCallProvider has to live above the room-router so the LK
	// connection survives channel navigation. When there's no active group
	// call it's a no-op pass-through; when there is, it owns the <LiveKitRoom>
	// and supplies MediaCallViewContext to anything in the subtree (the
	// per-room MediaCallRoomActivity reads it via provider={null}).
	return (
		<MediaCallProviderBase>
			<LiveKitMediaCallProvider>{children}</LiveKitMediaCallProvider>
		</MediaCallProviderBase>
	);
};

export default MediaCallProvider;
