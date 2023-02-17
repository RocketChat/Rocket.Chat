import type { IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom, isRoomFederated, isVoipRoom } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { useHasLicenseModule } from '../../../../../../ee/client/hooks/useHasLicenseModule';
import { useRoom } from '../../../contexts/RoomContext';
import { ComposerAnonymous } from './ComposerAnonymous';
import { ComposerBlocked } from './ComposerBlocked';
import { ComposerFederationDisabled } from './ComposerFederationDisabled';
import { ComposerFederationJoinRoomDisabled } from './ComposerFederationJoinRoomDisabled';
import { ComposerJoinWithPassword } from './ComposerJoinWithPassword';
import type { ComposerMessageProps } from './ComposerMessage';
import ComposerMessage from './ComposerMessage';
import ComposerOmnichannel from './ComposerOmnichannel/ComposerOmnichannel';
import { ComposerReadOnly } from './ComposerReadOnly';
import ComposerVoIP from './ComposerVoIP';
import { useMessageComposerIsAnonymous } from './hooks/useMessageComposerIsAnonymous';
import { useMessageComposerIsBlocked } from './hooks/useMessageComposerIsBlocked';
import { useMessageComposerIsReadOnly } from './hooks/useMessageComposerIsReadOnly';

const handleFederation = (
	room: IRoom,
	federationEnabled: boolean,
	federationModuleEnabled: boolean,
	{ children, ...props }: ComposerMessageProps,
): ReactElement => {
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

const ComposerContainer = ({ children, ...props }: ComposerMessageProps): ReactElement => {
	const room = useRoom();

	const mustJoinWithCode = !props.subscription && room.joinCodeRequired;

	const isAnonymous = useMessageComposerIsAnonymous();

	const isBlockedOrBlocker = useMessageComposerIsBlocked({ subscription: props.subscription });

	const isReadOnly = useMessageComposerIsReadOnly(props.rid, props.subscription);

	const isOmnichannel = isOmnichannelRoom(room);

	const isFederation = isRoomFederated(room);

	const isVoip = isVoipRoom(room);

	const federationModuleEnabled = useHasLicenseModule('federation') === true;

	const federationEnabled = useSetting('Federation_Matrix_enabled') === true;

	if (isOmnichannel) {
		return <ComposerOmnichannel {...props} />;
	}

	if (isVoip) {
		return <ComposerVoIP />;
	}

	if (isFederation) {
		return handleFederation(room, federationEnabled, federationModuleEnabled, { children, ...props });
	}

	if (isAnonymous) {
		return (
			<footer className='rc-message-box footer'>
				<ComposerAnonymous />
			</footer>
		);
	}

	if (mustJoinWithCode) {
		return (
			<footer className='rc-message-box footer'>
				<ComposerJoinWithPassword />
			</footer>
		);
	}

	if (isReadOnly) {
		return <ComposerReadOnly />;
	}

	if (isBlockedOrBlocker) {
		return (
			<footer className='rc-message-box footer'>
				<ComposerBlocked />
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

export default memo(ComposerContainer);
