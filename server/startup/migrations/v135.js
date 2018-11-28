const fixURLs = (text) => text.replace(/: \/\//g, '://');

RocketChat.Migrations.add({
	version: 135,
	up() {
		const header = RocketChat.models.Settings.findOne({ _id: 'Email_Header' });
		const footer = RocketChat.models.Settings.findOne({ _id: 'Email_Footer' });

		RocketChat.models.Settings.update({ _id: 'Email_Header' }, {
			$set: {
				value: fixURLs(header.value)
					.replace('src="[Site_Url]/assets/logo"', 'src="[Site_Url_Slash]assets/logo.png"')
					.replace('alt="Rocket.chat-logo"', 'alt="Rocket.chat"'),
			},
		});

		RocketChat.models.Settings.update({ _id: 'Email_Footer' }, {
			$set: {
				value: fixURLs(footer.value),
			},
		});
	},
});
