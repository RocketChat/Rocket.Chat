import type { ISubscription } from '@rocket.chat/core-typings';
import { Box, MessageDivider } from '@rocket.chat/fuselage';
import { MessageTypes } from '@rocket.chat/message-types';
import { ContextualbarEmptyContent } from '@rocket.chat/ui-client';
import type { UseInfiniteQueryResult } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { Fragment, memo } from 'react';

import { PaginatedVirtualList } from '../../../../../components/PaginatedVirtualList';
import RoomMessage from '../../../../../components/message/variants/RoomMessage';
import SystemMessage from '../../../../../components/message/variants/SystemMessage';
import MessageListErrorBoundary from '../../../MessageList/MessageListErrorBoundary';
import { isMessageNewDay } from '../../../MessageList/lib/isMessageNewDay';
import MessageListProvider from '../../../MessageList/providers/MessageListProvider';
import type { MessageSearchItem } from '../hooks/useMessageSearchQuery';

type MessageSearchProps = {
	items: MessageSearchItem[];
	itemCount: number;
	isPending: boolean;
	isSuccess: boolean;
	fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
	subscription: ISubscription | undefined;
	showUserAvatar: boolean;
	formatDate: (date: Date | string | number) => string;
	searchText: string;
	noResultsTitle: string;
};

const MessageSearch = ({
	items,
	itemCount,
	isPending,
	isSuccess,
	fetchNextPage,
	subscription,
	showUserAvatar,
	formatDate,
	searchText,
	noResultsTitle,
}: MessageSearchProps): ReactElement => {
	if (!isSuccess) {
		return <></>;
	}

	return (
		<>
			{items.length === 0 && <ContextualbarEmptyContent title={noResultsTitle} />}
			{items.length > 0 && (
				<MessageListErrorBoundary>
					<MessageListProvider>
						<Box
							is='section'
							display='flex'
							flexDirection='column'
							flexGrow={1}
							flexShrink={1}
							flexBasis={0}
							height='full'
							overflow='hidden'
							style={{ minHeight: 0 }}
						>
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
