import {helpRequest} from '../help-request';

// Definition of value objects. No clue why export interface is not supported
class HelpDiscussionCreatedResponse {
	constructor(url, members) {
		this.success = true;
		this.url = url;
		this.members = members;
	}
}

helpRequest.HelpDiscussionCreatedResponse = HelpDiscussionCreatedResponse;
