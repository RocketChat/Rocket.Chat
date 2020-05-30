import { Migrations } from '../../migrations';
import { Messages } from '../../../app/models';

Migrations.add({
	version: 17,
	up() {
		return Messages.tryDropIndex({
			_hidden: 1,
		});
	},
});
