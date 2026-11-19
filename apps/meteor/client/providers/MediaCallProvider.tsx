import { useHasLicenseModule } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';
import { MediaCallProvider as MediaCallProviderBase } from '@rocket.chat/ui-voip';
import type { ReactNode } from 'react';

import VoipSoundsProvider from './VoipSoundsProvider';

export type MediaCallProviderProps = { children: ReactNode };

const MediaCallProvider = ({ children }: MediaCallProviderProps) => {
	const canMakeInternalCall = usePermission('allow-internal-voice-calls');
	const canMakeExternalCall = usePermission('allow-external-voice-calls');

	const { data: hasModule = false } = useHasLicenseModule('teams-voip');

	const enabled = hasModule && (canMakeInternalCall || canMakeExternalCall);

	return (
		<VoipSoundsProvider>
			<MediaCallProviderBase enabled={enabled}>{children}</MediaCallProviderBase>
		</VoipSoundsProvider>
	);
};

export default MediaCallProvider;
