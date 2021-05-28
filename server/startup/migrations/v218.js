import { Migrations } from '../../../app/migrations/server';
import { Statistics } from '../../models';

Migrations.add({
	version: 218,
	up() {
		Statistics.tryDropIndex({ createdAt: 1 });
	},
});
