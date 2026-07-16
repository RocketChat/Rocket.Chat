import { MAX_SOURCE_MESSAGE_LENGTH } from '@rocket.chat/ai-search';
import type { IRoom } from '@rocket.chat/core-typings';
import {
	Box,
	Icon,
	Message,
	MessageBody,
	MessageContainer,
	MessageContainerFixed,
	MessageHeader,
	MessageLeftContainer,
	MessageName,
	MessageRole,
	MessageTimestamp,
	MessageUsername,
} from '@rocket.chat/fuselage';
import type { AISearchResult } from '@rocket.chat/rest-typings';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import type { ComponentProps, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import MarkdownText from '../../components/MarkdownText';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

const formatMessageTime = (ts: string | undefined): string => {
	if (!ts) {
		return '';
	}

	const date = new Date(ts);
	if (Number.isNaN(date.getTime())) {
		return '';
	}

	return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getMessageHref = (item: AISearchResult): string | undefined => {
	const { room } = item;
	if (!room) {
		return undefined;
	}

	const href = roomCoordinator.getRouteLink(room.t, {
		rid: room._id || item.rid,
		name: room.name,
	});

	return href ? `${href}?msg=${encodeURIComponent(item.msgId || item._id)}` : undefined;
};

const trimSourceMessage = (text: string): string =>
	text.length > MAX_SOURCE_MESSAGE_LENGTH ? `${text.slice(0, MAX_SOURCE_MESSAGE_LENGTH).trimEnd()}...` : text;

const getRoomIcon = (roomType: IRoom['t'] | undefined): ComponentProps<typeof Icon>['name'] => {
	if (roomType === 'd') {
		return 'at';
	}

	if (roomType === 'p') {
		return 'lock';
	}

	return 'hash';
};

export type SearchSourceResultProps = {
	item: AISearchResult;
};

const SearchSourceResult = ({ item }: SearchSourceResultProps): ReactElement => {
	const { t } = useTranslation();
	const roomLabel = item.room?.fname || item.room?.name;
	const href = getMessageHref(item);
	const username = item.u?.username || item.u?.name || t('Unknown_User');
	const displayName = item.u?.name || username;
	const messageTime = formatMessageTime(item.ts);
	const relevanceScore = typeof item.score === 'number' ? Math.max(0, Math.min(100, Math.round(item.score * 100))) : undefined;

	return (
		<Box
			is='article'
			role='listitem'
			position='relative'
			borderBlockEndWidth={1}
			borderBlockEndStyle='solid'
			borderBlockEndColor='extra-light'
			pbs={16}
			pbe={16}
		>
			<Message clickable={Boolean(href)}>
				<MessageLeftContainer>
					<MessageAvatar username={username} size='x36' />
				</MessageLeftContainer>
				<MessageContainer>
					<MessageHeader>
						<MessageName title={displayName}>{displayName}</MessageName>
						{item.u?.username && (
							<>
								{' '}
								<MessageUsername>@{item.u.username}</MessageUsername>
							</>
						)}
						{roomLabel && (
							<MessageRole>
								<Box display='flex' alignItems='center' gap={4}>
									<Icon name={getRoomIcon(item.room?.t)} size='x12' />
									{roomLabel}
								</Box>
							</MessageRole>
						)}
						{messageTime && <MessageTimestamp title={item.ts}>{messageTime}</MessageTimestamp>}
					</MessageHeader>
					<MessageBody>
						<MarkdownText
							content={trimSourceMessage(item.text || t('Intelligent_Search_Result'))}
							variant='inline'
							parseEmoji
							wordBreak='break-word'
						/>
					</MessageBody>
				</MessageContainer>
				{typeof relevanceScore === 'number' && (
					<MessageContainerFixed>
						<MessageRole title={`${relevanceScore}%`}>{relevanceScore}%</MessageRole>
					</MessageContainerFixed>
				)}
			</Message>
			{href && (
				<Box
					is='a'
					href={href}
					aria-label={t('Jump_to_message')}
					position='absolute'
					insetBlockStart={0}
					insetBlockEnd={0}
					insetInlineStart={0}
					insetInlineEnd={0}
				/>
			)}
		</Box>
	);
};

export default SearchSourceResult;
