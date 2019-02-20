import { Migrations } from 'meteor/rocketchat:migrations';
import { Settings } from 'meteor/rocketchat:models';

Migrations.add({
	version: 95,
	up() {
		if (Settings) {
			const emailHeader = Settings.findOne({ _id: 'Email_Header' });
			const emailFooter = Settings.findOne({ _id: 'Email_Footer' });
			const startWithHTML = emailHeader.value.match(/^<html>/);
			const endsWithHTML = emailFooter.value.match(/<\/html>$/);

			if (!startWithHTML) {
				Settings.update(
					{ _id: 'Email_Header' },
					{ $set: { value: `<html>${ emailHeader.value }` } }
				);
			}

			if (!endsWithHTML) {
				Settings.update(
					{ _id: 'Email_Footer' },
					{ $set: { value: `${ emailFooter.value }</html>` } }
				);
			}
		}
	},
});
