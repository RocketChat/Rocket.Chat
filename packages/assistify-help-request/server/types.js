import {helpRequest} from '../help-request';

// Definition of value objects. No clue why export interface is not supported
class HelpDiscussionCreatedResponse {
	constructor(url, providersJoined) {
		this.url = url;
		this.providers_joined = providersJoined;
	}
}

helpRequest.HelpDiscussionCreatedResponse = HelpDiscussionCreatedResponse;
