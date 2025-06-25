import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';
import type { ComposerMessageProps } from '../ComposerMessage';
import ComposerMessage from '../ComposerMessage';
import ComposerFederationDisabled from './ComposerFederationDisabled';
import ComposerFederationJoinRoomDisabled from './ComposerFederationJoinRoomDisabled';

const ComposerFederation = ({ subscription, children, ...props }: ComposerMessageProps): ReactElement => {
	const matrixFederationEnabled = useSetting('Federation_Matrix_enabled') === true;
	const serviceFederationEnabled = useSetting('FEDERATION_Service_Enabled') === true;
	const federationEnabled = matrixFederationEnabled || serviceFederationEnabled;
	const federationModuleEnabled = useHasLicenseModule('federation') === true;

	if (!federationEnabled) {
		return <ComposerFederationDisabled />;
	}

	if (!subscription && !federationModuleEnabled) {
		return <ComposerFederationJoinRoomDisabled />;
	}

	return (
		<>
			{children}
			<ComposerMessage {...props} />
		</>
	);
};

export default ComposerFederation;
