import { Emitter } from '@rocket.chat/emitter';
import { usePermission } from '@rocket.chat/ui-contexts';
import { MediaCallProvider as MediaCallProviderBase, MediaCallInstanceContext } from '@rocket.chat/ui-voip';
import { MediaCallAppActionsProvider } from '@rocket.chat/ui-voip/dist/experimental/AppActionButtons';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { useHasLicenseModule } from '../hooks/useHasLicenseModule';
import { useMediaCallWidgetAppsActionButtons } from '../hooks/useMediaCallWidgetAppsActionButtons';

const MediaCallProvider = ({ children }: { children: ReactNode }) => {
	const canMakeInternalCall = usePermission('allow-internal-voice-calls');
	const canMakeExternalCall = usePermission('allow-external-voice-calls');
	const { actions, handleInteraction } = useMediaCallWidgetAppsActionButtons();

	const { data: hasModule = false } = useHasLicenseModule('teams-voip');

	const unauthorizedContextValue = useMemo(
		() => ({
			currentViews: [],
			registerView: () => undefined,
			unregisterView: () => undefined,
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

	return (
		<MediaCallAppActionsProvider actions={actions} handleInteraction={handleInteraction}>
			<MediaCallProviderBase>{children}</MediaCallProviderBase>
		</MediaCallAppActionsProvider>
	);
};

export default MediaCallProvider;
