import { Migrations } from '../../../app/migrations/server';
import { LivechatInquiry } from '../../../app/models/server';

Migrations.add({
	version: 219,
	up() {
		LivechatInquiry.tryDropIndex({ message: 1 });
	},
});
