import type { IThreadMainMessage } from '@rocket.chat/core-typings';
import {
	Icon,
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemIcon,
	ItemLink,
	ItemMedia,
	ItemMeta,
	ItemRow,
	ItemTitle,
} from '@rocket.chat/fuselage';
import { ITEM_MEDIA_SIZE, MessageAvatar } from '@rocket.chat/ui-avatar';
import { useTimeAgo } from '@rocket.chat/ui-client';
import { useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { memo, useId } from 'react';
import { useTranslation } from 'react-i18next';

import ThreadListMetrics from './ThreadListMetrics';
import Emoji from '../../../../../components/Emoji';
import ThreadMetricsFollow from '../../../../../components/message/content/ThreadMetricsFollow';
import ThreadMetricsUnreadBadge from '../../../../../components/message/content/ThreadMetricsUnreadBadge';
import { normalizeThreadMessage } from '../../../../../lib/normalizeThreadMessage';
import { useDecryptedMessage } from '../hooks/useDecryptedMessage';

export type ThreadListItemProps = {
	thread: IThreadMainMessage;
	unread: string[];
	unreadUser: string[];
	unreadGroup: string[];
	hasDraft?: boolean;
	onClick: (tmid: IThreadMainMessage['_id']) => void;
};

const ThreadListItem = ({ thread, unread, unreadUser, unreadGroup, hasDraft, onClick }: ThreadListItemProps) => {
	const { t } = useTranslation();
	const uid = useUserId();
	const formatDate = useTimeAgo();
	const messageId = useId();
	const authorId = useId();
	const timeId = useId();
	const decryptedMsg = useDecryptedMessage(thread);
	const msg = normalizeThreadMessage({ ...thread, msg: decryptedMsg }, t);

	const { name = thread.u.username } = thread.u;
	const showRealNames = (useSetting('UI_Use_Real_Name') as boolean | undefined) ?? false;

	const following = !!uid && (thread.replies?.includes(uid) ?? false);
	const isUnread = unread.includes(thread._id);

	return (
		<Item inset='lg' highlighted={isUnread} data-id={thread._id}>
			<ItemMedia>
				<MessageAvatar
					emoji={thread.emoji ? <Emoji emojiHandle={thread.emoji} fillContainer /> : undefined}
					username={thread.u.username}
					size={ITEM_MEDIA_SIZE.extended}
				/>
			</ItemMedia>
			<ItemContent>
				<ItemRow>
					<ItemTitle id={authorId} aria-hidden>
						{showRealNames ? name : thread.u.username}
					</ItemTitle>
					<ItemMeta id={timeId} aria-hidden>
						{formatDate(thread.ts)}
					</ItemMeta>
					{hasDraft && (
						<ItemIcon label={t('Thread_draft')}>
							<Icon name='pencil' size='x16' />
						</ItemIcon>
					)}
				</ItemRow>
				<ItemDescription clamp={2}>
					<ItemLink is='button' aria-labelledby={`${messageId} ${authorId} ${timeId}`} onClick={() => onClick(thread._id)}>
						<span id={messageId}>{msg}</span>
					</ItemLink>
				</ItemDescription>
				<ThreadListMetrics lm={thread.tlm ?? thread.ts} participants={thread.replies ?? []} counter={thread.tcount ?? 0} />
			</ItemContent>
			<ItemActions>
				<ThreadMetricsUnreadBadge unread={isUnread} mention={unreadUser.includes(thread._id)} all={unreadGroup.includes(thread._id)} />
				<ThreadMetricsFollow following={following} mid={thread._id} rid={thread.rid} unread={false} mention={false} all={false} />
			</ItemActions>
		</Item>
	);
};

export default memo(ThreadListItem);
