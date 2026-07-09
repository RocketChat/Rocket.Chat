import { MAX_SOURCE_MESSAGE_LENGTH } from '@rocket.chat/ai-search';
import { Box, Icon, Tag } from '@rocket.chat/fuselage';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import type { IntelligentResult } from './types';
import MarkdownText from '../../components/MarkdownText';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

const formatMessageTime = (ts: Date | string | undefined): string => {
	if (!ts) return '';
	const date = new Date(ts);
	if (Number.isNaN(date.getTime())) return '';
	return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getMessageHref = (item: IntelligentResult): string | undefined => {
	const { room } = item;
	if (!room) {
		return undefined;
	}

	const href = roomCoordinator.getRouteLink(room.t, {
		rid: room._id || item.rid,
		name: room.name,
	});
	if (!href) return undefined;
	return `${href}?msg=${encodeURIComponent(item.msgId || item._id)}`;
};

const trimSourceMessage = (text: string): string =>
	text.length > MAX_SOURCE_MESSAGE_LENGTH ? `${text.slice(0, MAX_SOURCE_MESSAGE_LENGTH).trimEnd()}...` : text;

const getRoomIcon = (roomType: NonNullable<IntelligentResult['room']>['t'] | undefined): 'at' | 'hash' | 'lock' => {
	if (roomType === 'd') {
		return 'at';
	}

	if (roomType === 'p') {
		return 'lock';
	}

	return 'hash';
};

export const SearchSourceResult = ({ item }: { item: IntelligentResult }): ReactElement => {
	const { t } = useTranslation();
	const roomLabel = item.room?.fname || item.room?.name;
	const href = getMessageHref(item);
	const username = item.u?.username || item.u?.name || t('Unknown_User');
	const displayName = item.u?.name || username;
	const relevanceScore = typeof item.score === 'number' ? Math.max(0, Math.min(100, Math.round(item.score * 100))) : undefined;

	return (
		<Box
			is={href ? 'a' : 'article'}
			href={href}
			color='default'
			display='flex'
			alignItems='flex-start'
			role={href ? undefined : 'listitem'}
			textDecorationLine='none'
			p={16}
			mbe={12}
			border='var(--rcx-border-width-default) solid var(--rcx-color-stroke-extra-light)'
			borderRadius={4}
			bg='surface-light'
			gap={12}
		>
			<Box flexShrink={0}>
				<MessageAvatar username={username} size='x36' />
			</Box>
			<Box display='flex' flexDirection='column' flexGrow={1} minWidth={0}>
				<Box display='flex' alignItems='flex-start' justifyContent='space-between' gap={12} minWidth={0} mbe={6}>
					<Box display='flex' alignItems='center' flexWrap='wrap' flexGrow={1} gap={6} minWidth={0}>
						<Box is='span' fontScale='p2b' withTruncatedText>
							{displayName}
						</Box>
						{item.u?.username && (
							<Box is='span' color='hint' fontScale='p2' withTruncatedText>
								@{item.u.username}
							</Box>
						)}
						{roomLabel && (
							<Tag>
								<Box display='flex' alignItems='center' gap={4}>
									<Icon name={getRoomIcon(item.room?.t)} size='x12' />
									{roomLabel}
								</Box>
							</Tag>
						)}
						{item.ts && (
							<Box is='span' color='hint' fontScale='p2' flexShrink={0}>
								{formatMessageTime(item.ts)}
							</Box>
						)}
					</Box>
					{typeof relevanceScore === 'number' && (
						<Tag title={`${relevanceScore}%`} flexShrink={0}>
							{relevanceScore}%
						</Tag>
					)}
				</Box>
				<MarkdownText
					content={trimSourceMessage(item.text || t('Intelligent_Search_Result'))}
					variant='inline'
					parseEmoji
					fontScale='p2'
					lineHeight='x20'
					wordBreak='break-word'
				/>
			</Box>
		</Box>
	);
};
