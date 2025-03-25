import { Box, MessageDivider } from '@rocket.chat/fuselage';
import { useSetting, useTranslation, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { Fragment, memo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { MessageTypes } from '../../../../../../app/ui-utils/client';
import { ContextualbarEmptyContent } from '../../../../../components/Contextualbar';
import { VirtualizedScrollbars } from '../../../../../components/CustomScrollbars';
import RoomMessage from '../../../../../components/message/variants/RoomMessage';
import SystemMessage from '../../../../../components/message/variants/SystemMessage';
import { useFormatDate } from '../../../../../hooks/useFormatDate';
import MessageListErrorBoundary from '../../../MessageList/MessageListErrorBoundary';
import { isMessageNewDay } from '../../../MessageList/lib/isMessageNewDay';
import MessageListProvider from '../../../MessageList/providers/MessageListProvider';
import LoadingMessagesIndicator from '../../../body/LoadingMessagesIndicator';
import { useRoomSubscription } from '../../../contexts/RoomContext';
import { useMessageSearchQuery } from '../hooks/useMessageSearchQuery';

type MessageSearchProps = {
	searchText: string;
	globalSearch: boolean;
};

const MessageSearch = ({ searchText, globalSearch }: MessageSearchProps): ReactElement => {
	const t = useTranslation();
	const formatDate = useFormatDate();
	const pageSize = useSetting('PageSize', 10);
	const [limit, setLimit] = useState(pageSize);
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');

	const subscription = useRoomSubscription();
	const messageSearchQuery = useMessageSearchQuery({ searchText, limit, globalSearch });

	return (
		<Box display='flex' flexDirection='column' flexGrow={1} flexShrink={1} flexBasis={0}>
			{messageSearchQuery.data && (
				<>
					{messageSearchQuery.data.length === 0 && <ContextualbarEmptyContent title={t('No_results_found')} />}
					{messageSearchQuery.data.length > 0 && (
						<MessageListErrorBoundary>
							<MessageListProvider>
								<Box is='section' display='flex' flexDirection='column' flexGrow={1} flexShrink={1} flexBasis='auto' height='full'>
									<VirtualizedScrollbars>
										<Virtuoso
											totalCount={messageSearchQuery.data.length}
											overscan={25}
											data={messageSearchQuery.data}
											itemContent={(index, message) => {
												const previous = messageSearchQuery.data[index - 1];

												const newDay = isMessageNewDay(message, previous);

												const system = MessageTypes.isSystemMessage(message);

												const unread = subscription?.tunread?.includes(message._id) ?? false;
												const mention = subscription?.tunreadUser?.includes(message._id) ?? false;
												const all = subscription?.tunreadGroup?.includes(message._id) ?? false;

												return (
													<Fragment key={message._id}>
														{newDay && <MessageDivider>{formatDate(message.ts)}</MessageDivider>}

														{system ? (
															<SystemMessage message={message} showUserAvatar={showUserAvatar} />
														) : (
															<RoomMessage
																message={message}
																sequential={false}
																unread={unread}
																mention={mention}
																all={all}
																context='search'
																searchText={searchText}
																showUserAvatar={showUserAvatar}
															/>
														)}
													</Fragment>
												);
											}}
											endReached={() => {
												setLimit((limit) => limit + pageSize);
											}}
										/>
									</VirtualizedScrollbars>
								</Box>
							</MessageListProvider>
						</MessageListErrorBoundary>
					)}
				</>
			)}
			{searchText && messageSearchQuery.isLoading && <LoadingMessagesIndicator />}
		</Box>
	);
};

export default memo(MessageSearch);
