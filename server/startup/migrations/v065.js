import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 65,
	up() {
		if (Settings) {
			// New color settings - start with old settings as defaults
			const replace1 = Settings.findOne({ _id: 'theme-color-quaternary-font-color' });
			const replace2 = Settings.findOne({ _id: 'theme-color-input-font-color' });
			const replace3 = Settings.findOne({ _id: 'theme-color-status-online' });
			const replace4 = Settings.findOne({ _id: 'theme-color-status-away' });
			const replace5 = Settings.findOne({ _id: 'theme-color-status-busy' });
			const replace6 = Settings.findOne({ _id: 'theme-color-info-active-font-color' });
			if (replace1) {
				Settings.upsert({ _id: 'theme-color-secondary-action-color' }, { $set: { value: replace1.value } });
			}
			if (replace2) {
				Settings.upsert({ _id: 'theme-color-component-color' }, { $set: { value: replace2.value } });
			}
			if (replace3) {
				Settings.upsert({ _id: 'theme-color-success-color' }, { $set: { value: replace3.value } });
			}
			if (replace4) {
				Settings.upsert({ _id: 'theme-color-pending-color' }, { $set: { value: replace4.value } });
			}
			if (replace5) {
				Settings.upsert({ _id: 'theme-color-error-color' }, { $set: { value: replace5.value } });
			}
			if (replace6) {
				Settings.upsert({ _id: 'theme-color-selection-color' }, { $set: { value: replace6.value } });
			}

			// Renamed color settings
			const oldColor = Settings.findOne({ _id: 'theme-color-action-buttons-color' });
			if (oldColor) {
				Settings.remove({ _id: 'theme-color-action-buttons-color' });
				Settings.upsert({ _id: 'theme-color-primary-action-color' }, { $set: { value: oldColor.value } });
			}

			// Removed color settings
			Settings.remove({ _id: 'theme-color-quaternary-font-color' });
			Settings.remove({ _id: 'theme-color-active-channel-background-color' });
			Settings.remove({ _id: 'theme-color-active-channel-font-color' });
			Settings.remove({ _id: 'theme-color-blockquote-background' });
			Settings.remove({ _id: 'theme-color-clean-buttons-color' });
			Settings.remove({ _id: 'theme-color-code-background' });
			Settings.remove({ _id: 'theme-color-code-border' });
			Settings.remove({ _id: 'theme-color-code-color' });
			Settings.remove({ _id: 'theme-color-info-active-font-color' });
			Settings.remove({ _id: 'theme-color-input-font-color' });
			Settings.remove({ _id: 'theme-color-message-hover-background-color' });
			Settings.remove({ _id: 'theme-color-smallprint-font-color' });
			Settings.remove({ _id: 'theme-color-smallprint-hover-color' });
			Settings.remove({ _id: 'theme-color-unread-notification-color' });
		}
	},
});
