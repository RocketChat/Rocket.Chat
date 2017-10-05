import url from 'url';

RocketChat.Migrations.add({
	version: 36,
	up() {
		const loginHeader = RocketChat.models.Settings.findOne({
			_id: 'Layout_Login_Header'
		});

		if (!loginHeader || !loginHeader.value) {
			return;
		}

		const match = loginHeader.value.match(/<img\ssrc=['"]([^'"]+)/);

		if (match && match.length === 2) {
			let requestUrl = match[1];
			if (requestUrl[0] === '/') {
				requestUrl = url.resolve(Meteor.absoluteUrl(), requestUrl);
			}

			try {
				Meteor.startup(function() {
					return Meteor.setTimeout(function() {
						const result = HTTP.get(requestUrl, {
							npmRequestOptions: {
								encoding: 'binary'
							}
						});
						if (result.statusCode === 200) {
							return RocketChat.Assets.setAsset(result.content, result.headers['content-type'], 'logo');
						}
					}, 30000);
				});
			} catch (e) {
				console.log(e);
			}
		}

		return RocketChat.models.Settings.remove({
			_id: 'Layout_Login_Header'
		});
	}
});
