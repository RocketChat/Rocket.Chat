import { Box, MessageDivider } from '@rocket.chat/fuselage';
import { MessageTypes } from '@rocket.chat/message-types';
import { ContextualbarEmptyContent } from '@rocket.chat/ui-client';
import { useTranslation, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { Fragment, memo } from 'react';

import { PaginatedVirtualList } from '../../../../../components/PaginatedVirtualList';
import RoomMessage from '../../../../../components/message/variants/RoomMessage';
import SystemMessage from '../../../../../components/message/variants/SystemMessage';
import { useFormatDate } from '../../../../../hooks/useFormatDate';
import MessageListErrorBoundary from '../../../MessageList/MessageListErrorBoundary';
import { isMessageNewDay } from '../../../MessageList/lib/isMessageNewDay';
import MessageListProvider from '../../../MessageList/providers/MessageListProvider';
import { useRoomSubscription } from '../../../contexts/RoomContext';
import type { MessageSearchItem } from '../hooks/useMessageSearchQuery';
import { useMessageSearchQuery } from '../hooks/useMessageSearchQuery';

type MessageSearchProps = {
	searchText: string;
	globalSearch: boolean;
};

const MessageSearch = ({ searchText, globalSearch }: MessageSearchProps): ReactElement => {
	const t = useTranslation();
	const formatDate = useFormatDate();
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');

	const subscription = useRoomSubscription();
	const { isPending, isSuccess, data, fetchNextPage } = useMessageSearchQuery({ searchText, globalSearch });
	const items = data?.items || [];
	const itemCount = data?.itemCount ?? 0;

	if (!isSuccess) {
		return <></>;
	}

	return (
		<>
			{items.length === 0 && <ContextualbarEmptyContent title={t('No_results_found')} />}
			{items.length > 0 && (
				<MessageListErrorBoundary>
					<MessageListProvider>
						<Box is='section' display='flex' flexDirection='column' flexGrow={1} flexShrink={1} flexBasis='auto' height='full'>
							<Box h='full' w='full' style={{ minHeight: 0 }}>
								<PaginatedVirtualList
									items={items}
									totalCount={itemCount}
									overscan={25}
									onEndReached={isPending ? undefined : fetchNextPage}
									renderItem={(message: MessageSearchItem, index) => {
										const previous = items[index - 1];

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
								/>
							</Box>
						</Box>
					</MessageListProvider>
				</MessageListErrorBoundary>
			)}
		</>
	);
};

export default memo(MessageSearch);
