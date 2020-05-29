import { Migrations } from '../../../app/migrations';
import { Users } from '../../../app/models';
import { settings } from '../../../app/settings';

Migrations.add({
	version: 45,
	up() {
		// finds the latest created visitor
		const lastVisitor = Users.find({ type: 'visitor' }, { fields: { username: 1 }, sort: { createdAt: -1 }, limit: 1 }).fetch();

		if (lastVisitor && lastVisitor.length > 0) {
			const lastNumber = lastVisitor[0].username.replace(/^guest\-/, '');

			settings.add('Livechat_guest_count', parseInt(lastNumber) + 1, { type: 'int', group: 'Livechat' });
		}
	},
});
