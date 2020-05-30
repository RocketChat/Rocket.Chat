import { Migrations } from '../../migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 68,
	up() {
		const GoogleSiteVerification_id = Settings.findOne({ _id: 'GoogleSiteVerification_id' });

		if (GoogleSiteVerification_id && GoogleSiteVerification_id.value) {
			Settings.update({ _id: 'Meta_google-site-verification' }, {
				$set: {
					value: GoogleSiteVerification_id.value,
				},
			});
		}

		Settings.remove({ _id: 'GoogleSiteVerification_id' });
	},
});
