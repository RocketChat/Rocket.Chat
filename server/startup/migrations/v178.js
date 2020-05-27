import {
	Migrations,
} from '../../migrations';
import {
	Settings,
} from '../../../app/models';


Migrations.add({
	version: 178,
	up() {
		Settings.remove({ _id: 'Livechat_enable_inquiry_fetch_by_stream' });
	},
});
