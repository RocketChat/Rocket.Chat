import { Migrations } from '../../migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 14,
	up() {
		// Remove unused settings
		Settings.remove({ _id: 'API_Piwik_URL' });
		Settings.remove({ _id: 'API_Piwik_ID' });
		Settings.remove({ _id: 'Message_Edit' });
		Settings.remove({ _id: 'Message_Delete' });
		Settings.remove({ _id: 'Message_KeepStatusHistory' });

		Settings.update({ _id: 'Message_ShowEditedStatus' }, {
			$set: {
				type: 'boolean',
				value: true,
			},
		});

		Settings.update({ _id: 'Message_ShowDeletedStatus' }, {
			$set: {
				type: 'boolean',
				value: false,
			},
		});

		const metaKeys = [
			{
				old: 'Meta:language',
				new: 'Meta_language',
			}, {
				old: 'Meta:fb:app_id',
				new: 'Meta_fb_app_id',
			}, {
				old: 'Meta:robots',
				new: 'Meta_robots',
			}, {
				old: 'Meta:google-site-verification',
				new: 'Meta_google-site-verification',
			}, {
				old: 'Meta:msvalidate.01',
				new: 'Meta_msvalidate01',
			},
		];

		for (const oldAndNew of metaKeys) {
			const oldSetting = Settings.findOne({ _id: oldAndNew.old });
			const oldValue = oldSetting && oldSetting.value;

			const newSetting = Settings.findOne({ _id: oldAndNew.new });
			const newValue = newSetting && newSetting.value;

			if (oldValue && newValue) {
				Settings.update({
					_id: oldAndNew.new,
				}, {
					$set: {
						value: newValue,
					},
				});
			}

			Settings.remove({
				_id: oldAndNew.old,
			});
		}

		Settings.remove({
			_id: 'SMTP_Security',
		});
	},
});
