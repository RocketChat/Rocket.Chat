import { usePermission } from '@rocket.chat/ui-contexts';
import { MediaCallProvider as MediaCallProviderBase } from '@rocket.chat/ui-voip';
import type { ReactNode } from 'react';

import { useHasLicenseModule } from '../hooks/useHasLicenseModule';

const MediaCallProvider = ({ children }: { children: ReactNode }) => {
	const canMakeInternalCall = usePermission('allow-internal-voice-calls');
	const canMakeExternalCall = usePermission('allow-external-voice-calls');

	const { data: hasModule = false } = useHasLicenseModule('teams-voip');

	const enabled = hasModule && (canMakeInternalCall || canMakeExternalCall);

	return <MediaCallProviderBase enabled={enabled}>{children}</MediaCallProviderBase>;
};

export default MediaCallProvider;
