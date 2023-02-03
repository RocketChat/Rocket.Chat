import type { IMessage } from '@rocket.chat/core-typings';
import { Box, Throbber, MessageDivider } from '@rocket.chat/fuselage';
import { useEndpoint, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useMemo, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { MessageTypes } from '../../../../../app/ui-utils/client';
import ScrollableContentWrapper from '../../../../components/ScrollableContentWrapper';
import VerticalBarClose from '../../../../components/VerticalBar/VerticalBarClose';
import VerticalBarContent from '../../../../components/VerticalBar/VerticalBarContent';
import VerticalBarHeader from '../../../../components/VerticalBar/VerticalBarHeader';
import VerticalBarIcon from '../../../../components/VerticalBar/VerticalBarIcon';
import VerticalBarText from '../../../../components/VerticalBar/VerticalBarText';
import RoomMessage from '../../../../components/message/variants/RoomMessage';
import SystemMessage from '../../../../components/message/variants/SystemMessage';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import type { MessageWithMdEnforced } from '../../../../lib/parseMessageTextToAstMarkdown';
import { removePossibleNullMessageValues, parseMessageTextToAstMarkdown } from '../../../../lib/parseMessageTextToAstMarkdown';
import { mapMessageFromApi } from '../../../../lib/utils/mapMessageFromApi';
import MessageListErrorBoundary from '../../MessageList/MessageListErrorBoundary';
import { useAutoTranslate } from '../../MessageList/hooks/useAutoTranslate';
import { useKatex } from '../../MessageList/hooks/useKatex';
import { isMessageFirstUnread } from '../../MessageList/lib/isMessageFirstUnread';
import { isMessageNewDay } from '../../MessageList/lib/isMessageNewDay';
import MessageListProvider from '../../MessageList/providers/MessageListProvider';
import { useRoom, useRoomSubscription } from '../../contexts/RoomContext';
import { useTabBarClose } from '../../contexts/ToolboxContext';

const Mentions = (): ReactElement => {
	const t = useTranslation();
	const formatDate = useFormatDate();

	const closeTabBar = useTabBarClose();
	const handleTabBarCloseButtonClick = useCallback(() => {
		closeTabBar();
	}, [closeTabBar]);

	const room = useRoom();
	const subscription = useRoomSubscription();

	const getMentionedMessages = useEndpoint('GET', '/v1/chat.getMentionedMessages');

	const { katexEnabled, katexDollarSyntaxEnabled, katexParenthesisSyntaxEnabled } = useKatex();

	const autoTranslateOptions = useAutoTranslate(subscription);
	const showColors = Boolean(useSetting('HexColorPreview_Enabled'));

	const normalizeMessage = useMemo(() => {
		const parseOptions = {
			colors: showColors,
			emoticons: true,
			...(katexEnabled && {
				katex: {
					dollarSyntax: katexDollarSyntaxEnabled,
					parenthesisSyntax: katexParenthesisSyntaxEnabled,
				},
			}),
		};

		return (message: IMessage): MessageWithMdEnforced =>
			parseMessageTextToAstMarkdown(removePossibleNullMessageValues(message), parseOptions, autoTranslateOptions);
	}, [showColors, katexEnabled, katexDollarSyntaxEnabled, katexParenthesisSyntaxEnabled, autoTranslateOptions]);

	const mentionedMessagesQueryResult = useQuery(['rooms', room._id, 'mentioned-messages'] as const, async () => {
		const messages: IMessage[] = [];

		for (
			let offset = 0, result = await getMentionedMessages({ roomId: room._id, offset: 0 });
			result.count > 0;
			// eslint-disable-next-line no-await-in-loop
			offset += result.count, result = await getMentionedMessages({ roomId: room._id, offset })
		) {
			messages.push(...result.messages.map(mapMessageFromApi));
		}

		return messages.map(normalizeMessage);
	});

	return (
		<>
			<VerticalBarHeader>
				<VerticalBarIcon name='at' />
				<VerticalBarText>{t('Mentions')}</VerticalBarText>
				<VerticalBarClose onClick={handleTabBarCloseButtonClick} />
			</VerticalBarHeader>
			<VerticalBarContent flexShrink={1} flexGrow={1} paddingInline={0}>
				{mentionedMessagesQueryResult.isLoading && (
					<Box paddingInline={24} paddingBlock={12}>
						<Throbber size={12} />
					</Box>
				)}
				{mentionedMessagesQueryResult.isSuccess && (
					<>
						{mentionedMessagesQueryResult.data.length === 0 && (
							<Box p={24} color='annotation' textAlign='center' width='full'>
								{t('No_mentions_found')}
							</Box>
						)}

						{mentionedMessagesQueryResult.data.length > 0 && (
							<MessageListErrorBoundary>
								<MessageListProvider>
									<Box is='section' display='flex' flexDirection='column' flexGrow={1} flexShrink={1} flexBasis='auto' height='full'>
										<Virtuoso
											totalCount={mentionedMessagesQueryResult.data.length}
											overscan={25}
											data={mentionedMessagesQueryResult.data}
											components={{ Scroller: ScrollableContentWrapper }}
											itemContent={(index, message) => {
												const previous = mentionedMessagesQueryResult.data[index - 1];

												const newDay = isMessageNewDay(message, previous);
												const firstUnread = isMessageFirstUnread(subscription, message, previous);
												const showDivider = newDay || firstUnread;

												const system = MessageTypes.isSystemMessage(message);

												const unread = subscription?.tunread?.includes(message._id) ?? false;
												const mention = subscription?.tunreadUser?.includes(message._id) ?? false;
												const all = subscription?.tunreadGroup?.includes(message._id) ?? false;

												return (
													<>
														{showDivider && (
															<MessageDivider unreadLabel={firstUnread ? t('Unread_Messages').toLowerCase() : undefined}>
																{newDay && formatDate(message.ts)}
															</MessageDivider>
														)}

														{system ? (
															<SystemMessage message={message} />
														) : (
															<RoomMessage
																message={message}
																sequential={false}
																unread={unread}
																mention={mention}
																all={all}
																context='mentions'
															/>
														)}
													</>
												);
											}}
										/>
									</Box>
								</MessageListProvider>
							</MessageListErrorBoundary>
						)}
					</>
				)}
			</VerticalBarContent>
		</>
	);
};

export default Mentions;
