import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 228,
	up() {
		Settings.remove({ _id: 'API_Enable_Rate_Limiter' });
		Settings.remove({ _id: 'API_Enable_Rate_Limiter_Limit_Calls_Default' });
		Settings.remove({ _id: 'API_Enable_Rate_Limiter_Limit_Time_Default' });
	},
});
