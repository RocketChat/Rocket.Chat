import { Box } from '@rocket.chat/fuselage';
import { MessageFooterCallout } from '@rocket.chat/ui-composer';
import { useUserId } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsRoomOverMacLimit } from '../../../omnichannel/hooks/useIsRoomOverMacLimit';
import { useOmnichannelRoom, useUserIsSubscribed } from '../../contexts/RoomContext';
import type { ComposerMessageProps } from '../ComposerMessage';
import ComposerMessage from '../ComposerMessage';
import ComposerOmnichannelCallout from './ComposerOmnichannelCallout';
import { ComposerOmnichannelInquiry } from './ComposerOmnichannelInquiry';
import { ComposerOmnichannelJoin } from './ComposerOmnichannelJoin';
import { ComposerOmnichannelOnHold } from './ComposerOmnichannelOnHold';

// Keeps the footer's own siblings in block flow, out of the gap.
const ComposerOmnichannelLayout = ({ children }: { children: ReactNode }) => (
	<Box display='flex' flexDirection='column' gap={16}>
		<ComposerOmnichannelCallout />
		<Box>{children}</Box>
	</Box>
);

const ComposerOmnichannel = (props: ComposerMessageProps) => {
	const { t } = useTranslation();
	const userId = useUserId();
	const room = useOmnichannelRoom();

	const { servedBy, queuedAt, open, onHold } = room;

	const isSubscribed = useUserIsSubscribed();
	const isInquired = !servedBy && queuedAt;
	const isSameAgent = servedBy?._id === userId;
	const isRoomOverMacLimit = useIsRoomOverMacLimit(room);

	if (!open) {
		return (
			<ComposerOmnichannelLayout>
				<MessageFooterCallout color='default'>{t('This_conversation_is_already_closed')}</MessageFooterCallout>
			</ComposerOmnichannelLayout>
		);
	}

	if (isRoomOverMacLimit) {
		return (
			<ComposerOmnichannelLayout>
				<MessageFooterCallout color='default'>{t('Workspace_exceeded_MAC_limit_disclaimer')}</MessageFooterCallout>
			</ComposerOmnichannelLayout>
		);
	}

	if (onHold) {
		return (
			<ComposerOmnichannelLayout>
				<ComposerOmnichannelOnHold />
			</ComposerOmnichannelLayout>
		);
	}

	if (isInquired) {
		return (
			<ComposerOmnichannelLayout>
				<ComposerOmnichannelInquiry />
			</ComposerOmnichannelLayout>
		);
	}

	if (!isSubscribed && !isSameAgent) {
		return (
			<ComposerOmnichannelLayout>
				<ComposerOmnichannelJoin />
			</ComposerOmnichannelLayout>
		);
	}

	return (
		<ComposerOmnichannelLayout>
			<ComposerMessage {...props} />
		</ComposerOmnichannelLayout>
	);
};

export default ComposerOmnichannel;
