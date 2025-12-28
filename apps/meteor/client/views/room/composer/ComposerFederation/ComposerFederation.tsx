import type { ReactElement } from 'react';

import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';
import type { ComposerMessageProps } from '../ComposerMessage';
import ComposerMessage from '../ComposerMessage';
import ComposerFederationDisabled from './ComposerFederationDisabled';
import ComposerFederationInvalidVersion from './ComposerFederationInvalidVersion';
import ComposerFederationJoinRoomDisabled from './ComposerFederationJoinRoomDisabled';
import { useIsFederationEnabled } from '../../../../hooks/useIsFederationEnabled';

type ComposerFederationProps = ComposerMessageProps & {
	blocked?: boolean;
};

const ComposerFederation = ({ children, blocked, ...props }: ComposerFederationProps): ReactElement => {
	const federationEnabled = useIsFederationEnabled();
	const { data: federationModuleEnabled = false } = useHasLicenseModule('federation');

	if (blocked) {
		return <ComposerFederationInvalidVersion />;
	}

	if (!federationEnabled) {
		return <ComposerFederationDisabled />;
	}

	if (!federationModuleEnabled) {
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
