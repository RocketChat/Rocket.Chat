import { Migrations } from '../../../app/migrations/server';
import { Messages } from '../../../app/models/server';

Migrations.add({
	version: 210,
	up() {
		Messages.tryDropIndex({ slackBotId: 1, slackTs: 1 });
		Messages.tryEnsureIndex({ slackTs: 1, slackBotId: 1 }, { sparse: true });
	},
});
