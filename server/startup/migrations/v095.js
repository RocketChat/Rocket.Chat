RocketChat.Migrations.add({
	version: 95,
	up() {
		if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
			const emailHeader = RocketChat.models.Settings.findOne({ _id: 'Email_Header' });
			const emailFooter = RocketChat.models.Settings.findOne({ _id: 'Email_Footer' });
			const startWithHTML = emailHeader.value.match(/^<html>/);
			const endsWithHTML = emailFooter.value.match(/<\/html>$/);

			if (!startWithHTML) {
				RocketChat.models.Settings.update(
					{ _id: 'Email_Header' },
					{ $set: { value: `<html>${ emailHeader.value }`} }
				);
			}

			if (!endsWithHTML) {
				RocketChat.models.Settings.update(
					{ _id: 'Email_Footer' },
					{ $set: { value: `${ emailFooter.value }</html>`} }
				);
			}
		}
	}
});
