/* globals OEmbed */
import _ from 'underscore';

RocketChat.Migrations.add({
	version: 7,
	up() {
		console.log('Populate urls in messages');

		const query = RocketChat.models.Messages.find({
			'urls.0': {
				$exists: true
			}
		});

		const count = query.count();

		query.forEach((message, index) => {
			console.log(`${ index + 1 } / ${ count }`);

			message.urls = message.urls.map((url) => {
				if (_.isString(url)) {
					return {
						url
					};
				}
				return url;
			});

			return OEmbed.rocketUrlParser(message);
		});

		return console.log('End');
	}
});
