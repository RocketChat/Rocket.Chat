// Definition of value objects. No clue why export interface is not supported
export class HelpDiscussionCreatedResponse {
	constructor(url, room, members) {
		this.success = true;
		this.url = url;
		this.room = room;
		this.members = members;
	}
}
