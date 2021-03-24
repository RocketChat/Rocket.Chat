import React, { useCallback, useMemo, useState, memo, useEffect } from 'react';
import { TextInput, Icon } from '@rocket.chat/fuselage';
import UserSummaryMessage from "./Component/UserSummaryMessage"
import { useUserSummary, useUserSubscriptions, useUserRoom, useUserSummaryAll, useUserSubscriptionsAll } from '../../../../hooks/useUserSummary';
import { useUserId } from '../../../../../../contexts/UserContext';
import { Virtuoso } from 'react-virtuoso';
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { RoomHistoryManager } from '../../../../../../../app/ui-utils';
import { Template } from 'meteor/templating';
import { useDebouncedValue, useResizeObserver, useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { useMethod } from '../../../../../../contexts/ServerContext'
import { Rooms, Messages } from '../../../../../../../app/models'

export function withData(WrappedComponent) {
	return ({
		rid, 
		showAll, 
		...props 
	}) => {
		//We can also use a Meteor method to fetch discussions
		//const messages = useMethod('getUserSummary')
		const userId = useUserId();
		let room;
		let messages;
		let subscription;
		switch (!showAll) {
			case true:
				room = useUserRoom(rid);
				messages = useUserSummary(rid, userId);
				subscription = useUserSubscriptions(rid, userId);
				break;
			default:
				messages = useUserSummaryAll(userId);
				subscription = useUserSubscriptionsAll(userId);
				break;
		}
	
		//We should maybe find a less expensive way to get all the data
		const result = [...subscription, ...messages]
		//result.sort((a,b)=>b.ts-a.ts)


		const [text, setText] = useState('');
		const handleTextChange = useCallback((event) => {
			setText(event.currentTarget.value);
		}, []);
		const debouncedText = useDebouncedValue(text, 400);
		const options = useMemo(() => ({
			rid,
			text: debouncedText,
		}), [rid, debouncedText]);

		
		return <WrappedComponent
			{...props}
            messages={result}
			userId={userId}
			text={text}
			setText={handleTextChange}
			rid={rid}
			roomName={room ? room.name : null}
		/>;
	};
}

const Row = memo(function Row({
	messages,
	goToMess,
	roomName
}) {
	const {
		_updatedAt, 
		msg, 
		repliesCount, 
		tcount, 
		threadMsg, 
		ts, 
		dateReactions, 
		reactions, 
		rid, 
		fname, 
		roles, 
		editedAt, 
		description, 
		sysMes
	} = messages;

	return <UserSummaryMessage
        _updatedAt={_updatedAt}
		msg={msg}
		repliesCount={repliesCount}
		tcount={tcount}
		threadMsg={threadMsg}
		message={messages}
		sysMes={sysMes}
		ts={ts}
		dateReactions={dateReactions}
		reactions={reactions}
		fname={fname}
		editedAt={editedAt}
		description={description}
		roles={roles}
		roomName={roomName}
		goToMess={goToMess}
	/>;
	
});

export function UserSummaryList({ 
	messages, 
	userId, 
	rid, 
	roomName,
	setText,
	text
}) {

	const inputRef = useAutoFocus(true);

	const goToMess = (message) => {
		if (message.tmid) {
			return FlowRouter.go(FlowRouter.getRouteName(), {
				tab: 'thread',
				context: message.tmid,
				rid: rid,
				name: Rooms.findOne({ _id: rid }).name,
			}, {
				jump: message._id,
			});
		}

		if (Session.get('openedRoom') === message.rid) {
			return RoomHistoryManager.getSurroundingMessages(message, 50);
		}
		FlowRouter.goToRoomById(message.rid);

		if (window.matchMedia('(max-width: 500px)').matches) {
			Template.instance().tabBar.close();
		}

		window.setTimeout(() => {
			RoomHistoryManager.getSurroundingMessages(message, 50);
		}, 400);
	}
	return  <> <TextInput style={{width:'450px'}} ref={inputRef} placeholder={'Search by date'} value={text} onChange={setText} addon={<Icon name='magnifier' size='x20'/>}/>
				{
					<Virtuoso
						style={{ height: "500px" }}
						totalCount={messages.length - 1}
						data={messages}
						itemContent={(index, data) => <Row messages={data} goToMess={goToMess} roomName={roomName} />}
					/>
				}                     
			</>
}

export default withData(UserSummaryList);