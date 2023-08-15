import type { IRoom } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import React from 'react';
import type { ReactElement } from 'react';

import { useHasLicenseModule } from '../../../../../ee/client/hooks/useHasLicenseModule';
import type { ComposerMessageProps } from '../ComposerMessage';
import ComposerMessage from '../ComposerMessage';
import ComposerFederationDisabled from './ComposerFederationDisabled';
import ComposerFederationJoinRoomDisabled from './ComposerFederationJoinRoomDisabled';

const ComposerFederation = ({ room, subscription, children, ...props }: ComposerMessageProps & { room: IRoom }): ReactElement => {
	const federationEnabled = useSetting('Federation_Matrix_enabled') === true;
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
			<ComposerMessage readOnly={room.ro} {...props} />
		</>
	);
};

export default ComposerFederation;
