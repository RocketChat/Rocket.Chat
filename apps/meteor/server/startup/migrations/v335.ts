import { Permissions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
    version: 335,
    name: 'Add medsense-edit-patient-context permission',
    async up() {
        await Permissions.create('medsense-edit-patient-context', ['admin', 'bot', 'livechat-manager']);
    },
});
