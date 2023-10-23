import { MessageFooterCallout } from '@rocket.chat/ui-composer';
import { useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useIsRoomOverMacLimit } from '../../../../hooks/omnichannel/useIsRoomOverMacLimit';
import { useOmnichannelRoom, useUserIsSubscribed } from '../../contexts/RoomContext';
import type { ComposerMessageProps } from '../ComposerMessage';
import ComposerMessage from '../ComposerMessage';
import { ComposerOmnichannelInquiry } from './ComposerOmnichannelInquiry';
import { ComposerOmnichannelJoin } from './ComposerOmnichannelJoin';
import { ComposerOmnichannelOnHold } from './ComposerOmnichannelOnHold';

const ComposerOmnichannel = (props: ComposerMessageProps): ReactElement => {
	const room = useOmnichannelRoom();
	const { servedBy, queuedAt, open, onHold } = room;
	const userId = useUserId();

	const isSubscribed = useUserIsSubscribed();

	const t = useTranslation();

	const isInquired = !servedBy && queuedAt;

	const isSameAgent = servedBy?._id === userId;

	const isRoomOverMacLimit = useIsRoomOverMacLimit(room);

	if (!open) {
		return <MessageFooterCallout color='default'>{t('This_conversation_is_already_closed')}</MessageFooterCallout>;
	}

	if (isRoomOverMacLimit) {
		return <MessageFooterCallout color='default'>{t('Workspace_exceeded_MAC_limit_disclaimer')}</MessageFooterCallout>;
	}

	if (onHold) {
		return <ComposerOmnichannelOnHold />;
	}

	if (isInquired) {
		return <ComposerOmnichannelInquiry />;
	}

	if (!isSubscribed && !isSameAgent) {
		return <ComposerOmnichannelJoin />;
	}

	return <ComposerMessage {...props} />;
};

export default ComposerOmnichannel;
