import type { IDiscussionMessage } from '@rocket.chat/core-typings';
import {
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
	Message,
} from '@rocket.chat/fuselage';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import type { ComponentProps, ReactNode } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import Emoji from '../../../../../components/Emoji';
import { activateWithKeyboard } from '../../../../../lib/clickableItem';

export type DiscussionListItemProps = {
	_id: IDiscussionMessage['_id'];
	msg: ReactNode;
	dcount: number;
	dlm: Date | undefined;
	formatDate: (date: Date) => string;
	username: IDiscussionMessage['u']['username'];
	name?: IDiscussionMessage['u']['name'];
	ts: IDiscussionMessage['ts'];
	emoji: IDiscussionMessage['emoji'];
} & ComponentProps<typeof Message>;

const DiscussionListItem = ({
	_id,
	msg,
	username,
	name = username,
	ts,
	dcount,
	formatDate,
	dlm,
	emoji,
	...props
}: DiscussionListItemProps) => {
	const { t } = useTranslation();
	return (
		<Message clickable insetBlock='md' tabIndex={0} onKeyDown={activateWithKeyboard} {...props}>
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
		</Message>
	);
};

export default memo(DiscussionListItem);
