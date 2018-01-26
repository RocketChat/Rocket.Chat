// Definition of value objects. No clue why export interface is not supported
export class HelpDiscussionCreatedResponse {
	constructor(url, id, members) {
		this.success = true;
		this.url = url;
		this.id = id;
		this.members = members;
	}
}
