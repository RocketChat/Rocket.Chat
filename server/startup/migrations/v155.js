import { Migrations } from '../../migrations';
import { Settings } from '../../../app/models/server';

Migrations.add({
	version: 155,
	up() {
		const _id = 'Livechat_Routing_Method';
		const setting = Settings.findOne({ _id });
		if (setting) {
			const { value } = setting;

			let newValue;
			switch (value) {
				case 'Least_Amount':
					newValue = 'Auto_Selection';
					break;
				case 'Guest_Pool':
					newValue = 'Manual_Selection';
					break;
			}

			if (!newValue) {
				return;
			}

			Settings.update({ _id }, {
				$set: {
					value: newValue,
					packageValue: newValue,
				},
			});
		}
	},
});
