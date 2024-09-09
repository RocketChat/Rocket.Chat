import type { IMessage } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useMembersList } from '/client/views/hooks/useMembersList';
import { useUserRoom } from '@rocket.chat/ui-contexts';
import './MarkedAsDone.styles.css';

/*
This whole class is based on RoomMembersWithData.tsx
*/

type validRoomType = 'd' | 'p' | 'c';

type MarkedAsDoneProps = {
	message: IMessage;
};

const MarkedAsDone = ({ message }: MarkedAsDoneProps): ReactElement => {
	const room = useUserRoom(message.rid);

	if (!room || room.t === 'd') {
		return <></>;
	}

	// TODO: Warning! We are omitting the pagination here, because our limit is higher than our employee count. This DOES NOT SCALE!
	const { data } = useMembersList(
		useMemo(() => ({ rid: message.rid, type: "all", limit: 100, debouncedText: "", roomType: room.t as validRoomType }), [message.rid, room.t]),
	);

	 // Note: We reduce by 1 because the message sender doesn't need to "acknowledge" the message.
	const numChannelUsers = data?.pages[data.pages.length - 1].total ? data?.pages[data.pages.length - 1].total - 1 : 0;
	const numMarkedAsDone = message.markedAsDone ? message.markedAsDone.filter((marker : any) => marker._id != message.u._id).length : 0;
	const color = numMarkedAsDone >= numChannelUsers ? "green" : "#ff8c00"; 

	return (
		<div className="MarkedAsDoneContainer">
			<div style={{color: color}}>
				Marked as done ({numMarkedAsDone}/{numChannelUsers}): 
			</div>
			{data?.pages?.flatMap((page) => page.members).filter((member : any) => member.username && member._id != message.u._id).map((member) => {
				const hasMarkedAsDone = message.markedAsDone ? message.markedAsDone.some((marker : any) => marker._id === member._id) : false;
				const grayscale = hasMarkedAsDone ? "grayscale(0)" : "grayscale(1)";
				const opacity = hasMarkedAsDone ? 1.0 : 0.3;
				return (<UserAvatar key={member._id} size='x20' username={member.username!} style={{filter: grayscale, opacity: opacity}}/>);
			})}
		</div>
	);
};

export default MarkedAsDone;
