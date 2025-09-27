import type { ReactElement } from 'react';

import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';
import type { ComposerMessageProps } from '../ComposerMessage';
import ComposerMessage from '../ComposerMessage';
import ComposerFederationDisabled from './ComposerFederationDisabled';
import ComposerFederationJoinRoomDisabled from './ComposerFederationJoinRoomDisabled';
import { useIsFederationEnabled } from '../../../../hooks/useIsFederationEnabled';

const ComposerFederation = ({ subscription, children, ...props }: ComposerMessageProps): ReactElement => {
	const federationEnabled = useIsFederationEnabled();
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
