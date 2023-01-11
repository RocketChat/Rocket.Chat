import { GrandfatherLicense, LivechatDepartment } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 283,
	async up() {
		// If a workspace has 1 or more departments created on their workspace when they are migrating from
		// v5 to v6, then they'd be eligible for grandfathering strategy where they'd still have access to
		// department's feature in v6.

		const existingDepartments = await LivechatDepartment.find({}).toArray();
		if (existingDepartments.length <= 0) {
			return;
		}

		// This workspace is eligible for grandfathering strategy
		await GrandfatherLicense.insertLicense('livechat-department-enterprise');
	},
});
