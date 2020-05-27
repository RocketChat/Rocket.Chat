import {
	Migrations,
} from '../../migrations';
import {
	Settings,
} from '../../../app/models';

Migrations.add({
	version: 172,
	up() {
		const settings = Settings.find({ _id: /Message_HideType_.*/i }).fetch();

		Settings.update({ _id: 'Hide_System_Messages' }, { $set: { value: settings.filter((setting) => setting.value).map((setting) => setting._id.replace('Message_HideType_')) } });
		Settings.remove({ _id: /Message_HideType_.*/i }, { multi: true });
	},
});
