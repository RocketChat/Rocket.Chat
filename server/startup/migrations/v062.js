import { Migrations } from '../../migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 62,
	up() {
		Settings.remove({ _id: 'Atlassian Crowd', type: 'group' });
	},
});
