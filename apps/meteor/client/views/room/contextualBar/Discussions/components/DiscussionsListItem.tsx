import { VisuallyHidden } from '@react-aria/visually-hidden';
import type { IDiscussionMessage } from '@rocket.chat/core-typings';
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemLink,
	ItemMedia,
	ItemMeta,
	ItemRow,
	ItemTitle,
	MessageMetrics,
	MessageMetricsItem,
	MessageMetricsItemIcon,
	MessageMetricsItemLabel,
} from '@rocket.chat/fuselage';
import { ITEM_MEDIA_SIZE, MessageAvatar } from '@rocket.chat/ui-avatar';
import type { MouseEvent, ReactNode } from 'react';
import { memo, useId } from 'react';
import { useTranslation } from 'react-i18next';

import Emoji from '../../../../../components/Emoji';

export type DiscussionListItemProps = {
	msg: ReactNode;
	dcount: number;
	dlm: Date | undefined;
	formatDate: (date: Date) => string;
	username: IDiscussionMessage['u']['username'];
	name?: IDiscussionMessage['u']['name'];
	ts: IDiscussionMessage['ts'];
	emoji: IDiscussionMessage['emoji'];
	drid?: IDiscussionMessage['drid'];
	onClick?: (event: MouseEvent<HTMLElement>) => void;
};

const DiscussionListItem = ({
	msg,
	username,
	name = username,
	ts,
	dcount,
	formatDate,
	dlm,
	emoji,
	drid,
	onClick,
}: DiscussionListItemProps) => {
	const { t } = useTranslation();
	const messageId = useId();
	const authorId = useId();
	const timeId = useId();

	return (
		<Item inset='lg'>
			<ItemMedia>
				<MessageAvatar
					emoji={emoji ? <Emoji emojiHandle={emoji} fillContainer /> : undefined}
					username={username}
					size={ITEM_MEDIA_SIZE.extended}
				/>
			</ItemMedia>
			<ItemContent>
				<ItemRow>
					<ItemTitle id={authorId} aria-hidden>
						{name}
					</ItemTitle>
					<ItemMeta id={timeId} aria-hidden>
						{formatDate(ts)}
					</ItemMeta>
				</ItemRow>
				<ItemDescription clamp={2}>
					<ItemLink is='button' data-drid={drid} aria-labelledby={`${messageId} ${authorId} ${timeId}`} onClick={onClick}>
						<span id={messageId}>{msg}</span>
					</ItemLink>
				</ItemDescription>
				<MessageMetrics>
					{!dcount && (
						<MessageMetricsItem>
							<MessageMetricsItemLabel>{t('No_messages_yet')}</MessageMetricsItemLabel>
						</MessageMetricsItem>
					)}
					{!!dcount && (
						<MessageMetricsItem>
							<MessageMetricsItemIcon name='discussion' />
							<MessageMetricsItemLabel aria-hidden>{dcount}</MessageMetricsItemLabel>
							<VisuallyHidden>{t('message_counter', { count: dcount })}</VisuallyHidden>
						</MessageMetricsItem>
					)}
					{!!dcount && dlm && (
						<MessageMetricsItem>
							<MessageMetricsItemIcon name='clock' />
							<MessageMetricsItemLabel aria-hidden>{formatDate(dlm)}</MessageMetricsItemLabel>
							<VisuallyHidden>{t('Last_message__date__', { date: formatDate(dlm) })}</VisuallyHidden>
						</MessageMetricsItem>
					)}
				</MessageMetrics>
			</ItemContent>
		</Item>
	);
};

export default memo(DiscussionListItem);
