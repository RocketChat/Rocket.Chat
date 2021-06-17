import { Migrations } from '../migrations';
import { Avatars } from '../../models';

Migrations.add({
	version: 203,
	up() {
		Avatars.tryDropIndex({ name: 1 });
		Avatars.tryEnsureIndex({ name: 1 }, { sparse: true });
	},
});
