import type { IRoom, ISubscription, IThreadMainMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Badge, Box, Button, Icon, Palette, Skeleton } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useSetting } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import RoomHoverCardSectionLabel from './RoomHoverCardSectionLabel';
import RoomHoverCardThreadPreview from './RoomHoverCardThreadPreview';
import { getHoverCardMessagePreview } from './getHoverCardMessagePreview';
import { mapMessageFromApi } from '../../lib/utils/mapMessageFromApi';

const MAX_LISTED_THREADS = 4;

const PREVIEW_OPEN_DELAY = 300;
const PREVIEW_CLOSE_DELAY = 300;

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

const previewedRowStyle = css`
	border-color: ${Palette.stroke['stroke-highlight']};
	background-color: ${Palette.surface['surface-hover']};
`;

type Mention = 'user' | 'group' | undefined;

type UnreadThread = { message: IThreadMainMessage; mention: Mention; lastReplyAt: number };

type Preview = { thread: IThreadMainMessage; anchor: Element };

const byMentionThenLastReply = (a: UnreadThread, b: UnreadThread) =>
	Number(Boolean(b.mention)) - Number(Boolean(a.mention)) || b.lastReplyAt - a.lastReplyAt;

export type RoomHoverCardThreadsProps = {
	room: IRoom;
	subscription: ISubscription;
	roomName: string;
	onOpenThread: (tmid: IThreadMainMessage['_id']) => void;
	onOpenThreads: () => void;
};

/**
 * The room's threads with unread replies, mentions first. A row opens its thread; resting the pointer on it previews
 * the thread next to the card.
 */
const RoomHoverCardThreads = ({ room, subscription, roomName, onOpenThread, onOpenThreads }: RoomHoverCardThreadsProps) => {
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
					const message = mapMessageFromApi<IThreadMainMessage>(thread);
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

	// Hover intent for the preview, like the card's: it waits for the pointer to rest on a row, and lingers while the
	// pointer crosses over to it.
	const [preview, setPreview] = useState<Preview | null>(null);
	const timers = useRef<{ open?: ReturnType<typeof setTimeout>; close?: ReturnType<typeof setTimeout> }>({});

	const cancelPreviewTimers = useStableCallback(() => {
		clearTimeout(timers.current.open);
		clearTimeout(timers.current.close);
		timers.current = {};
	});

	const closePreview = useStableCallback(() => {
		cancelPreviewTimers();
		setPreview(null);
	});

	const closePreviewAfterLinger = useStableCallback(() => {
		clearTimeout(timers.current.open);
		timers.current.close ??= setTimeout(closePreview, PREVIEW_CLOSE_DELAY);
	});

	const keepPreview = useStableCallback(() => cancelPreviewTimers());

	const handleRowEnter = useStableCallback((thread: IThreadMainMessage, anchor: Element) => {
		cancelPreviewTimers();
		if (preview?.thread._id === thread._id) {
			return;
		}
		timers.current.open = setTimeout(() => setPreview({ thread, anchor }), PREVIEW_OPEN_DELAY);
	});

	useEffect(() => () => cancelPreviewTimers(), [cancelPreviewTimers]);

	const anchorRef = useMemo(() => ({ current: preview?.anchor ?? null }), [preview]);

	if (!threadsEnabled || total === 0) {
		return null;
	}

	// The subscription can still list threads that were read elsewhere or deleted; once loaded, the server's list counts.
	const count = threads?.length ?? total;
	const listed = threads?.slice(0, MAX_LISTED_THREADS) ?? [];
	const notListed = count - listed.length;
	const notListedMentions = threads?.slice(MAX_LISTED_THREADS).filter(({ mention }) => mention).length ?? 0;

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
				{listed.map(({ message, mention }, index) => {
					const previewed = preview?.thread._id === message._id;

					return (
						<Box is='li' key={message._id} marginBlockStart={index > 0 ? 6 : undefined}>
							<Box
								is='button'
								type='button'
								aria-expanded={previewed}
								className={[rowStyle, mention && mentionedRowStyle, previewed && previewedRowStyle]}
								onClick={() => onOpenThread(message._id)}
								onMouseEnter={(e) => handleRowEnter(message, e.currentTarget)}
								onMouseLeave={closePreviewAfterLinger}
							>
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
								{previewed && <Icon name='chevron-left' size='x16' color='font-default' />}
								{!previewed && (
									<Badge small variant={(mention === 'user' && 'danger') || (mention === 'group' && 'warning') || 'primary'} />
								)}
							</Box>
						</Box>
					);
				})}
			</Box>
			{!isPending && notListed > 0 && (
				<Box display='flex' alignItems='center' marginBlockStart={8} paddingInlineStart={4}>
					<Box fontScale='c1' color='font-hint'>
						{t('More_unread_threads', { count: notListed })}
					</Box>
					{notListedMentions > 0 && (
						<Box display='flex' alignItems='center' marginInlineStart={8} fontScale='c1' color='status-font-on-danger'>
							<Badge small variant='danger' />
							<Box marginInlineStart={4}>{t('mentions_counter', { count: notListedMentions })}</Box>
						</Box>
					)}
					<Box flexGrow={1} />
					<Button small secondary onClick={onOpenThreads}>
						{t('View_all_threads')}
						<Icon name='arrow-forward' size='x16' marginInlineStart={6} />
					</Button>
				</Box>
			)}
			{preview && (
				<RoomHoverCardThreadPreview
					key={preview.thread._id}
					thread={preview.thread}
					room={room}
					roomName={roomName}
					subscription={subscription}
					triggerRef={anchorRef}
					onOpenThread={onOpenThread}
					onPointerEnter={keepPreview}
					onPointerLeave={closePreviewAfterLinger}
					onClose={closePreview}
				/>
			)}
		</Box>
	);
};

export default RoomHoverCardThreads;
