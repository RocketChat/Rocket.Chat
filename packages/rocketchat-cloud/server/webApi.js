import { Meteor } from 'meteor/meteor';

export class RocketChatCloudInternalApi {
	constructor() {
		this.api = new RocketChat.API.ApiClass({
			version: 'cloud',
			useDefaultAuth: true,
			prettyJson: false,
			enableCors: false,
			auth: RocketChat.API.getUserAuth(),
		});

		this.addRoutes();
	}

	addRoutes() {
		this.api.addRoute('', { authRequired: false }, {
			get() {
				console.log('hello');
			},
		});

		this.api.addRoute('/redirect', { authRequired: false }, {
			get() {
				console.log(this.queryParams);
				if (!this.queryParams.code || !this.queryParams.state) {
					return RocketChat.API.v1.failure({ error: 'invalid code or state provided' });
				}

				Meteor.call('cloud:continueConnecting', (err, result) => {
					if (err) {
						return RocketChat.API.v1.failure({ error: 'invalid' });
					}

					console.log('The result', result);
				});
			},
		});
	}
}
