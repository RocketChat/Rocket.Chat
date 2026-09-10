import { usePermission, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import { MediaCallProvider as MediaCallProviderBase } from '@rocket.chat/ui-voip';
import { MediaCallAppActionsProvider } from '@rocket.chat/ui-voip/dist/experimental/AppActionButtons';
import type { ReactNode } from 'react';

import { useHasLicenseModule } from '../hooks/useHasLicenseModule';
import { useMediaCallWidgetAppsActionButtons } from '../hooks/useMediaCallWidgetAppsActionButtons';

export type MediaCallProviderProps = { children: ReactNode };

const MediaCallProvider = ({ children }: MediaCallProviderProps) => {
	const canMakeInternalCall = usePermission('allow-internal-voice-calls');
	const canMakeExternalCall = usePermission('allow-external-voice-calls');
	const { actions, handleInteraction } = useMediaCallWidgetAppsActionButtons();

	const currentRoute = useCurrentRoutePath();

	const isConferenceRoute = currentRoute?.includes('/conference');

	const { data: hasModule = false } = useHasLicenseModule('teams-voip');

	const enabled = hasModule && (canMakeInternalCall || canMakeExternalCall) && !isConferenceRoute;

	return (
		<MediaCallAppActionsProvider actions={actions} handleInteraction={handleInteraction}>
			<MediaCallProviderBase enabled={enabled}>{children}</MediaCallProviderBase>
		</MediaCallAppActionsProvider>
	);
};

export default MediaCallProvider;
