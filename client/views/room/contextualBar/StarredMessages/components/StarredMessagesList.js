import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Box } from '@rocket.chat/fuselage';

import { RoomHistoryManager } from '../../../../../../app/ui-utils';
import { Rooms } from '../../../../../../app/models/client';
import Message from './Message';
import { useTimeAgo } from '../../../../../hooks/useTimeAgo';


export const StarredMessagesList = ({
	onClose,
	loadMore,
	messages,
	u,
}) => {
	const timeAgo = useTimeAgo();

	const message = useCallback((index, data) => (
		<Message
			key={index}
			_id={data._id}
			msg={data.msg}
			username={u.username}
			name={u.name || u.username}
			timestamp={timeAgo(data.ts)}
			onClick={() => {
				if (window.matchMedia('(max-width: 500px)').matches) {
					onClose();
				}
				if (data.tmid) {
					return FlowRouter.go(FlowRouter.getRouteName(), {
						tab: 'thread',
						context: data.tmid,
						jump: data._id,
						rid: data.rid,
						name: Rooms.findOne({ _id: data.rid }).name,
					}, {
						jump: data._id,
					});
				}

				RoomHistoryManager.getSurroundingMessages(data, 50);
			}}
		/>
	), [u.username, u.name, timeAgo, onClose]);

	return (
		<Box is='ul' w='full' h='full' flexShrink={1} overflow='hidden'>
			<Virtuoso
				style={{ height: '100%' }}
				endReached={loadMore}
				overscan={100}
				itemContent={(index, data) => message(index, data)}
				data={messages}
			/>
		</Box>
	);
};
