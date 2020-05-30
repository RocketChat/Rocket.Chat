import { Migrations } from '../../migrations';
import { Users } from '../../../app/models';

Migrations.add({
	version: 52,
	up() {
		Users.update({ _id: 'rocket.cat' }, { $addToSet: { roles: 'bot' } });
	},
});
