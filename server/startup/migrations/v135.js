import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

const fixURLs = (text) => text.replace(/: \/\//g, '://');

Migrations.add({
	version: 135,
	up() {
		const header = Settings.findOne({ _id: 'Email_Header' });
		const footer = Settings.findOne({ _id: 'Email_Footer' });

		Settings.update({ _id: 'Email_Header' }, {
			$set: {
				value: fixURLs(header.value)
					.replace('src="[Site_Url]/assets/logo"', 'src="[Site_Url_Slash]assets/logo.png"')
					.replace('alt="Rocket.chat-logo"', 'alt="Rocket.chat"'),
			},
		});

		Settings.update({ _id: 'Email_Footer' }, {
			$set: {
				value: fixURLs(footer.value),
			},
		});
	},
});
