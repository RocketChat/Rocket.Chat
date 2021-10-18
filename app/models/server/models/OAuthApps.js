import { Base } from './_Base';

export class OAuthApps extends Base {
	constructor() {
		super('oauth_apps');
	}
}

export default new OAuthApps();
