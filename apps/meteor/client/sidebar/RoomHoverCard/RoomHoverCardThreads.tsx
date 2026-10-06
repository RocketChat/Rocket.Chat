import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Badge, Box, Icon, Palette, Skeleton } from '@rocket.chat/fuselage';
import { useEndpoint, useSetting } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import RoomHoverCardSectionLabel from './RoomHoverCardSectionLabel';
import { getHoverCardMessagePreview } from './getHoverCardMessagePreview';
import { mapMessageFromApi } from '../../lib/utils/mapMessageFromApi';

const MAX_LISTED_THREADS = 4;

const rowStyle = css`
	display: flex;
	align-items: center;
	box-sizing: border-box;
	width: 100%;
	min-height: 1.875rem;
	padding-inline: 0.5rem;
	border: 1px solid ${Palette.stroke['stroke-light']};
	border-radius: 0.375rem;
	background-color: ${Palette.surface['surface-light']};
	color: inherit;
	font: inherit;
	text-align: start;
	cursor: pointer;

	&:hover {
		background-color: ${Palette.surface['surface-hover']};
	}

	&:focus-visible {
		outline: 2px solid ${Palette.stroke['stroke-highlight']};
		outline-offset: 1px;
	}
`;

const mentionedRowStyle = css`
	border-color: ${Palette.stroke['stroke-extra-light-error']};
`;

type Mention = 'user' | 'group' | undefined;

type UnreadThread = { message: IMessage; mention: Mention; lastReplyAt: number };

const byMentionThenLastReply = (a: UnreadThread, b: UnreadThread) =>
	Number(Boolean(b.mention)) - Number(Boolean(a.mention)) || b.lastReplyAt - a.lastReplyAt;

export type RoomHoverCardThreadsProps = {
	subscription: ISubscription;
	onOpenThread: (tmid: IMessage['_id']) => void;
	onOpenThreads: () => void;
};

/** The room's threads with unread replies, mentions first, each opening its thread. */
const RoomHoverCardThreads = ({ subscription, onOpenThread, onOpenThreads }: RoomHoverCardThreadsProps) => {
	const { t } = useTranslation();
	const threadsEnabled = useSetting('Threads_enabled', true);

	const unreadIds = subscription.tunread ?? [];
	const total = unreadIds.length;

	const getThreads = useEndpoint('GET', '/v1/chat.getThreadsList');
	const { data: threads, isPending } = useQuery({
		queryKey: ['sidebar', 'room-hover-card', subscription.rid, 'unread-threads', unreadIds],
		queryFn: async () => {
			const { threads } = await getThreads({ rid: subscription.rid, type: 'unread', count: 50 });
			const userMentions = new Set(subscription.tunreadUser);
			const groupMentions = new Set(subscription.tunreadGroup);

			return threads
				.map((thread): UnreadThread => {
					const message = mapMessageFromApi(thread);
					return {
						message,
						mention: (userMentions.has(message._id) && 'user') || (groupMentions.has(message._id) && 'group') || undefined,
						lastReplyAt: (message.tlm ?? message.ts).getTime(),
					};
				})
				.sort(byMentionThenLastReply);
		},
		enabled: threadsEnabled && total > 0,
	});

	if (!threadsEnabled || total === 0) {
		return null;
	}

	// The subscription can still list threads that were read elsewhere or deleted; once loaded, the server's list counts.
	const count = threads?.length ?? total;
	const listed = threads?.slice(0, MAX_LISTED_THREADS) ?? [];
	const notListed = count - listed.length;

	if (count === 0) {
		return null;
	}

	return (
		<Box
			backgroundColor='surface-tint'
			borderBlockStartWidth='default'
			borderBlockStartColor='stroke-extra-light'
			paddingInline={18}
			paddingBlockStart={12}
			paddingBlockEnd={14}
		>
			<RoomHoverCardSectionLabel>{t('Unread_threads_count', { count })}</RoomHoverCardSectionLabel>
			<Box is='ul' display='flex' flexDirection='column' marginBlockStart={8}>
				{isPending &&
					Array.from({ length: Math.min(total, MAX_LISTED_THREADS) }, (_, index) => (
						<Box is='li' key={index} marginBlockStart={index > 0 ? 6 : undefined}>
							<Skeleton variant='rect' height='x30' />
						</Box>
					))}
				{listed.map(({ message, mention }, index) => (
					<Box is='li' key={message._id} marginBlockStart={index > 0 ? 6 : undefined}>
						<Box is='button' type='button' className={[rowStyle, mention && mentionedRowStyle]} onClick={() => onOpenThread(message._id)}>
							<Icon name='thread' size='x16' color='font-secondary-info' />
							<Box
								flexGrow={1}
								minWidth={0}
								marginInline={6}
								fontScale='c1'
								color='font-default'
								withTruncatedText
								dangerouslySetInnerHTML={{ __html: getHoverCardMessagePreview(message, t) }}
							/>
							{mention ? (
								<Badge variant={mention === 'user' ? 'danger' : 'warning'} title={t('Mentions')}>
									@
								</Badge>
							) : (
								<Badge small variant='primary' />
							)}
						</Box>
					</Box>
				))}
				{!isPending && notListed > 0 && (
					<Box is='li' marginBlockStart={listed.length > 0 ? 6 : undefined}>
						<Box is='button' type='button' className={rowStyle} onClick={onOpenThreads}>
							<Icon name='thread' size='x16' color='font-secondary-info' />
							<Box flexGrow={1} marginInline={6} fontScale='c1' color='font-info'>
								{t('More_unread_threads', { count: notListed })}
							</Box>
						</Box>
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default RoomHoverCardThreads;
