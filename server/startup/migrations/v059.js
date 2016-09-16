RocketChat.Migrations.add({
	version: 58,
	up: function() {
		if (RocketChat && RocketChat.models && RocketChat.models.Settings) {

			// New color settings (with old settings as defaults)
			RocketChat.models.Settings.upsert({ _id: 'theme-color-secondary-action-color' }, { $set: { value: RocketChat.models.Settings.findOne({ _id: 'theme-color-quaternary-font-color' }) } });
			RocketChat.models.Settings.upsert({ _id: 'theme-color-component-color' }, { $set: { value: RocketChat.models.Settings.findOne({ _id: 'theme-color-input-font-color' }) } });
			RocketChat.models.Settings.upsert({ _id: 'theme-color-success-color' }, { $set: { value: RocketChat.models.Settings.findOne({ _id: 'theme-color-status-online' }) } });
			RocketChat.models.Settings.upsert({ _id: 'theme-color-pending-color' }, { $set: { value: RocketChat.models.Settings.findOne({ _id: 'theme-color-status-away' }) } });
			RocketChat.models.Settings.upsert({ _id: 'theme-color-error-color' }, { $set: { value: RocketChat.models.Settings.findOne({ _id: 'theme-color-status-busy' }) } });
			RocketChat.models.Settings.upsert({ _id: 'theme-color-selection-color' }, { $set: { value: RocketChat.models.Settings.findOne({ _id: 'theme-color-info-active-font-color' }) } });

			// Renamed color settings
			var oldColor = RocketChat.models.Settings.findOne({ _id: 'theme-color-action-buttons-color' });
			if (oldColor) {
				RocketChat.models.Settings.remove({ _id: 'theme-color-action-buttons-color' });
				RocketChat.models.Settings.upsert({ _id: 'theme-color-primary-action-color' }, { $set: { value: oldColor.value } });
			}

			// Removed color settings
			RocketChat.models.Settings.remove({ _id: 'quaternary-font-color' });
			RocketChat.models.Settings.remove({ _id: 'active-channel-background-color' });
			RocketChat.models.Settings.remove({ _id: 'active-channel-font-color' });
			RocketChat.models.Settings.remove({ _id: 'blockquote-background' });
			RocketChat.models.Settings.remove({ _id: 'clean-buttons-color' });
			RocketChat.models.Settings.remove({ _id: 'code-background' });
			RocketChat.models.Settings.remove({ _id: 'code-border' });
			RocketChat.models.Settings.remove({ _id: 'code-color' });
			RocketChat.models.Settings.remove({ _id: 'info-active-font-color' });
			RocketChat.models.Settings.remove({ _id: 'input-font-color' });
			RocketChat.models.Settings.remove({ _id: 'message-hover-background-color' });
			RocketChat.models.Settings.remove({ _id: 'smallprint-font-color' });
			RocketChat.models.Settings.remove({ _id: 'smallprint-hover-color' });
			RocketChat.models.Settings.remove({ _id: 'unread-notification-color' });
		}
	}
});
