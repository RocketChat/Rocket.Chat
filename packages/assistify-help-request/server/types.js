// Definition of value objects. No clue why export interface is not supported
export class HelpDiscussionCreatedResponse {
	constructor(url, room, members) {
		this.success = true;
		this.url = url;
		this.room = {'_id': room._id, 'name': room.name, 't': room.t, 'expertise': room.expertise, 'topic': room.topic, 'helpRequestId': room.helpRequestId};
		this.members = members;
	}
}
