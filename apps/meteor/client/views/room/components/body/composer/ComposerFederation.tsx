import type { IRoom } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import React from 'react';
import type { ReactElement } from 'react';

import { useHasLicenseModule } from '../../../../../../ee/client/hooks/useHasLicenseModule';
import { ComposerFederationDisabled } from './ComposerFederationDisabled';
import { ComposerFederationJoinRoomDisabled } from './ComposerFederationJoinRoomDisabled';
import type { ComposerMessageProps } from './ComposerMessage';
import ComposerMessage from './ComposerMessage';

export const FederationComposer = ({ room, children, ...props }: ComposerMessageProps & { room: IRoom }): ReactElement => {
	const federationModuleEnabled = useHasLicenseModule('federation') === true;

	const federationEnabled = useSetting('Federation_Matrix_enabled') === true;

	if (!federationEnabled) {
		return (
			<footer className='rc-message-box footer'>
				<ComposerFederationDisabled />
			</footer>
		);
	}
	if (!props.subscription && !federationModuleEnabled) {
		return (
			<footer className='rc-message-box footer'>
				<ComposerFederationJoinRoomDisabled />
			</footer>
		);
	}
	return (
		<footer className='rc-message-box footer'>
			{children}
			<ComposerMessage readOnly={room.ro} {...props} />
		</footer>
	);
};
