RocketChat.Migrations.add({
	version: 65,
	up() {
		if (RocketChat && RocketChat.models && RocketChat.models.Settings) {

			// New color settings - start with old settings as defaults
			const replace1 = RocketChat.models.Settings.findOne({ _id: 'theme-color-quaternary-font-color' });
			const replace2 = RocketChat.models.Settings.findOne({ _id: 'theme-color-input-font-color' });
			const replace3 = RocketChat.models.Settings.findOne({ _id: 'theme-color-status-online' });
			const replace4 = RocketChat.models.Settings.findOne({ _id: 'theme-color-status-away' });
			const replace5 = RocketChat.models.Settings.findOne({ _id: 'theme-color-status-busy' });
			const replace6 = RocketChat.models.Settings.findOne({ _id: 'theme-color-info-active-font-color' });
			if (replace1) {
				RocketChat.models.Settings.upsert({ _id: 'theme-color-secondary-action-color' }, { $set: { value: replace1.value } });
			}
			if (replace2) {
				RocketChat.models.Settings.upsert({ _id: 'theme-color-component-color' }, { $set: { value: replace2.value } });
			}
			if (replace3) {
				RocketChat.models.Settings.upsert({ _id: 'theme-color-success-color' }, { $set: { value: replace3.value } });
			}
			if (replace4) {
				RocketChat.models.Settings.upsert({ _id: 'theme-color-pending-color' }, { $set: { value: replace4.value } });
			}
			if (replace5) {
				RocketChat.models.Settings.upsert({ _id: 'theme-color-error-color' }, { $set: { value: replace5.value } });
			}
			if (replace6) {
				RocketChat.models.Settings.upsert({ _id: 'theme-color-selection-color' }, { $set: { value: replace6.value } });
			}

			// Renamed color settings
			const oldColor = RocketChat.models.Settings.findOne({ _id: 'theme-color-action-buttons-color' });
			if (oldColor) {
				RocketChat.models.Settings.remove({ _id: 'theme-color-action-buttons-color' });
				RocketChat.models.Settings.upsert({ _id: 'theme-color-primary-action-color' }, { $set: { value: oldColor.value } });
			}

			// Removed color settings
			RocketChat.models.Settings.remove({ _id: 'theme-color-quaternary-font-color' });
			RocketChat.models.Settings.remove({ _id: 'theme-color-active-channel-background-color' });
			RocketChat.models.Settings.remove({ _id: 'theme-color-active-channel-font-color' });
			RocketChat.models.Settings.remove({ _id: 'theme-color-blockquote-background' });
			RocketChat.models.Settings.remove({ _id: 'theme-color-clean-buttons-color' });
			RocketChat.models.Settings.remove({ _id: 'theme-color-code-background' });
			RocketChat.models.Settings.remove({ _id: 'theme-color-code-border' });
			RocketChat.models.Settings.remove({ _id: 'theme-color-code-color' });
			RocketChat.models.Settings.remove({ _id: 'theme-color-info-active-font-color' });
			RocketChat.models.Settings.remove({ _id: 'theme-color-input-font-color' });
			RocketChat.models.Settings.remove({ _id: 'theme-color-message-hover-background-color' });
			RocketChat.models.Settings.remove({ _id: 'theme-color-smallprint-font-color' });
			RocketChat.models.Settings.remove({ _id: 'theme-color-smallprint-hover-color' });
			RocketChat.models.Settings.remove({ _id: 'theme-color-unread-notification-color' });
		}
	}
});
