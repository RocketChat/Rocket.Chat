import {
	MessageMetricsItem,
	MessageMetricsItemLabel,
	MessageMetricsItemAvatarRow,
	MessageMetricsItemIcon,
	MessageMetricsItemAvatarRowContent,
} from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

type ThreadMetricsParticipantsProps = {
	participants: Array<string>;
};

const ThreadMetricsParticipants = ({ participants }: ThreadMetricsParticipantsProps): ReactElement => {
	const t = useTranslation();

	const hideAvatar = !useUserPreference('displayAvatars');

	const participantsLengthExcludingVisibleAvatars = participants.length - 2;
	const participantsLabel = participantsLengthExcludingVisibleAvatars > 0 ? `+${participantsLengthExcludingVisibleAvatars}` : undefined;

	return (
		<MessageMetricsItem title={t('Follower', { count: participants.length })}>
			{hideAvatar && (
				<>
					<MessageMetricsItemIcon name='user' />
					<MessageMetricsItemLabel>{participants.length}</MessageMetricsItemLabel>
				</>
			)}
			{!hideAvatar && (
				<>
					<MessageMetricsItemAvatarRow>
						{participants.slice(0, 2).map((uid) => (
							<MessageMetricsItemAvatarRowContent key={uid}>
								<UserAvatar size='x16' userId={uid} />
							</MessageMetricsItemAvatarRowContent>
						))}
					</MessageMetricsItemAvatarRow>
					{participantsLabel && <MessageMetricsItemLabel>{participantsLabel}</MessageMetricsItemLabel>}
				</>
			)}
		</MessageMetricsItem>
	);
};

export default ThreadMetricsParticipants;
