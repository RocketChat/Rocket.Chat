import { useCurrentRoutePath, usePermission } from '@rocket.chat/ui-contexts';
import { MediaCallProvider as MediaCallProviderBase } from '@rocket.chat/ui-voip';
import type { ReactNode } from 'react';

import { useHasLicenseModule } from '../hooks/useHasLicenseModule';

export type MediaCallProviderProps = { children: ReactNode };

const MediaCallProvider = ({ children }: MediaCallProviderProps) => {
	const canMakeInternalCall = usePermission('allow-internal-voice-calls');
	const canMakeExternalCall = usePermission('allow-external-voice-calls');

	const { data: hasModule = false } = useHasLicenseModule('teams-voip');

	// The call window runs its own copy of the app, and a voice stack in it would ring beside a call already in
	// progress — and place one the reader cannot see.
	const isConferenceRoute = useCurrentRoutePath()?.includes('/conference');

	const enabled = hasModule && (canMakeInternalCall || canMakeExternalCall) && !isConferenceRoute;

	return <MediaCallProviderBase enabled={enabled}>{children}</MediaCallProviderBase>;
};

export default MediaCallProvider;
