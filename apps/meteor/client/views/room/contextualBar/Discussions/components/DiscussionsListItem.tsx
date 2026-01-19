import type { IDiscussionMessage } from '@rocket.chat/core-typings';
import {
	Box,
	Message,
	MessageLeftContainer,
	MessageContainer,
	MessageHeader,
	MessageName,
	MessageTimestamp,
	MessageBody,
	MessageBlock,
	MessageMetrics,
	MessageMetricsItem,
	MessageMetricsItemLabel,
	MessageMetricsItemIcon,
} from '@rocket.chat/fuselage';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import Emoji from '../../../../../components/Emoji';
import { clickableItem } from '../../../../../lib/clickableItem';

type DiscussionListItemProps = {
	_id: IDiscussionMessage['_id'];
	msg: ReactNode;
	dcount: number;
	dlm: Date | undefined;
	formatDate: (date: Date) => string;
	username: IDiscussionMessage['u']['username'];
	name?: IDiscussionMessage['u']['name'];
	ts: IDiscussionMessage['ts'];
	emoji: IDiscussionMessage['emoji'];
} & Omit<ComponentProps<typeof Box>, 'is'>;

const DiscussionListItem = ({
	_id,
	msg,
	username,
	name = username,
	ts,
	dcount,
	formatDate = (date: any) => date,
	dlm,
	className = [],
	emoji,
	...props
}: DiscussionListItemProps): ReactElement => {
	const { t } = useTranslation();
	return (
		<Box is={Message} {...props} className={className} pbs={16} pbe={8}>
			<MessageLeftContainer>
				<MessageAvatar emoji={emoji ? <Emoji emojiHandle={emoji} fillContainer /> : undefined} username={username} size='x36' />
			</MessageLeftContainer>
			<MessageContainer>
				<MessageHeader>
					<MessageName title={username}>{name}</MessageName>
					<MessageTimestamp>{formatDate(ts)}</MessageTimestamp>
				</MessageHeader>
				<MessageBody clamp={2}>{msg}</MessageBody>
				<MessageBlock>
					<MessageMetrics>
						{!dcount && (
							<MessageMetricsItem>
								<MessageMetricsItemLabel>{t('No_messages_yet')}</MessageMetricsItemLabel>
							</MessageMetricsItem>
						)}
						{!!dcount && (
							<MessageMetricsItem>
								<MessageMetricsItemIcon name='discussion' />
								<MessageMetricsItemLabel>{dcount}</MessageMetricsItemLabel>
							</MessageMetricsItem>
						)}
						{!!dcount && (
							<MessageMetricsItem>
								<MessageMetricsItemIcon name='clock' />
								<MessageMetricsItemLabel>{dlm ? formatDate(dlm) : undefined}</MessageMetricsItemLabel>
							</MessageMetricsItem>
						)}
					</MessageMetrics>
				</MessageBlock>
			</MessageContainer>
		</Box>
	);
};

export default memo(clickableItem(DiscussionListItem));
