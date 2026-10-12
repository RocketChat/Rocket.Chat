import { Messages } from '@rocket.chat/models';
import { addMigration } from '../../lib/migrations';

addMigration({
    version: 336,
    name: 'Change expireAt type for messages',
    async up() {
        await Messages.col.updateMany({
            t: 'livechat_navigation_history',
            expireAt: { $type: 'number' } 
        },  [
            { $set: { expireAt: { $toDate: "$expireAt" } }
        }]);
    }
});
