import { Migrations } from '../../../app/migrations/server';
import { Statistics } from '../../../app/models/server';

Migrations.add({
	version: 218,
	up() {
		Statistics.tryDropIndex({ createdAt: 1 });
	},
});
