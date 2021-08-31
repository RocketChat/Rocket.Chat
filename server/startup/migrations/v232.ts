import { Migrations } from '../../../app/migrations/server';
import { Settings } from '../../../app/models/server';

Migrations.add({
	version: 232,
	up() {
		Settings.remove({ _id: 'API_Enable_Rate_Limiter' });
		Settings.remove({ _id: 'API_Enable_Rate_Limiter_Limit_Calls_Default' });
		Settings.remove({ _id: 'API_Enable_Rate_Limiter_Limit_Time_Default' });
	},
});
