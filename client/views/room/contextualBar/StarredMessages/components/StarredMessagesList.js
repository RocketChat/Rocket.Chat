import React, { useCallback } from 'react';
import InfiniteLoader from 'react-window-infinite-loader';
import { FixedSizeList as List } from 'react-window';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { Box } from '@rocket.chat/fuselage';

import Message from './Message';
import ScrollableContentWrapper from '../../../../../components/ScrollableContentWrapper';

export const StarredMessagesList = ({
	loadMore,
	messages,
	rid,
	subscription,
	settings,
	u,
}) => {
	const { ref, contentBoxSize: { blockSize = 780 } = {} } = useResizeObserver({ debounceDelay: 100 });

	const children = useCallback(({ data, index, style }) => {
		const item = data[index] || null;

		return item && <Message
			key={item._id}
			msg={item}
			context='starred'
			room={rid}
			groupable={false}
			subscription={subscription}
			settings={settings}
			u={u}
			style={style}
		/>;
	}, [rid, settings, subscription, u]);

	return (
		<Box is='ul' w='full' h='full' flexShrink={1} ref={ref} overflow='hidden'>
			<InfiniteLoader
				isItemLoaded={({ index }) => !!messages[index]}
				itemCount={messages.length}
				loadMoreItems={loadMore}
			>
				{({ onItemsRendered, ref }) => (
					<List
						outerElementType={ScrollableContentWrapper}
						className='List'
						height={blockSize}
						itemCount={messages.length}
						itemSize={74}
						itemData={messages}
						onItemsRendered={onItemsRendered}
						ref={ref}
					>
						{children}
					</List>
				)}
			</InfiniteLoader>
		</Box>
	);
};
