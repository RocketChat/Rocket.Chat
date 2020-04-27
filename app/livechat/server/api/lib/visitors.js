import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatVisitors, Messages, LivechatRooms } from '../../../../models/server/raw';
import { canAccessRoomAsync } from '../../../../authorization/server/functions/canAccessRoom';
import { Meteor } from 'meteor/meteor';

export async function findVisitorInfo({ userId, visitorId }) {
	if (!await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}

	const visitor = await LivechatVisitors.findOneById(visitorId);
	if (!visitor) {
		throw new Error('visitor-not-found');
	}

	return {
		visitor,
	};
}

export async function findVisitedPages({ userId, roomId, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}
	const room = await LivechatRooms.findOneById(roomId);
	if (!room) {
		throw new Error('invalid-room');
	}
	const cursor = Messages.findByRoomIdAndType(room._id, 'livechat_navigation_history', {
		sort: sort || { ts: -1 },
		skip: offset,
		limit: count,
	});
	
	const total = await cursor.count();

	const pages = await cursor.toArray();

	return {
		pages,
		count: pages.length,
		offset,
		total,
	};
}

export async function findChatHistory({ userId, roomId, visitorId,text, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}
	const room = await LivechatRooms.findOneById(roomId);
	if (!room) {
		throw new Error('invalid-room');
	}
	if (!await canAccessRoomAsync(room, { _id: userId })) {
		throw new Error('error-not-allowed');
	}

	const cursor = LivechatRooms.findByVisitorId(visitorId, {
		sort: sort || { ts: -1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();
	const history = await cursor.toArray();
	if(text == 'null'){
		return {
			history,
			count: history.length,
			offset,
			total,
			
		};
		
	}else{
		let resultArray=[];
		Meteor.runAsUser(userId,()=>{
			for(var i=0; i<history.length; i++){
				var roomid = history[i]._id;
				var count = 1000;
				var result = Meteor.call('messageSearch',text,roomid,count).message.docs;
				if(result.length>0){
					for(var j=0; j<result.length; j++){
						resultArray.push(result[j])
					}	
				}
			}
		})
		
		return {
			history,
			count: history.length,
			offset,
			total,
			resultArray,
			
		};
		
	}
	
}
