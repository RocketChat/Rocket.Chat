import { Migrations } from '../../migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 167,
	up() {
		Settings.update({ _id: 'Livechat_agent_leave_action' }, { $set: { section: 'Sessions' } });
		Settings.update({ _id: 'Livechat_agent_leave_action_timeout' }, { $set: { section: 'Sessions' } });
		Settings.update({ _id: 'Livechat_agent_leave_comment' }, { $set: { section: 'Sessions' } });
	},
});
