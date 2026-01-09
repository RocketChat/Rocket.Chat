import { Messages } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

/**
 * Migration to fix null fields in messages imported from Slack.
 * 
 * Issue: https://github.com/RocketChat/Rocket.Chat/issues/37058
 * 
 * The Slack importer was creating messages with null values for various fields,
 * which broke the message loading query. This migration removes those null fields
 * and converts null arrays to empty arrays.
 * 
 * This migration complements PR #37805 which fixes the root cause in MessageConverter.ts.
 */
addMigration({
    version: 333,
    name: 'Remove null fields from Slack-imported messages',
    async up() {
        // Fields to remove if they are null
        const fieldsToUnset = [
            't',
            'groupable',
            'tmid', // Thread message ID - critical field that breaks message loading
            'tlm', // Thread last message
            'tcount', // Thread count
            'replies',
            'editedBy',
            '_importFile',
            'url',
            'bot',
            'alias',
        ];

        // Remove null values for each field
        for (const field of fieldsToUnset) {
            const result = await Messages.updateMany(
                { [field]: null },
                { $unset: { [field]: '' } }
            );

            if (result.modifiedCount > 0) {
                console.log(`Migration v333: Removed null '${field}' from ${result.modifiedCount} messages`);
            }
        }

        // Convert null arrays to empty arrays
        const arrayFields = ['mentions', 'urls'];

        for (const field of arrayFields) {
            const result = await Messages.updateMany(
                { [field]: null },
                { $set: { [field]: [] } }
            );

            if (result.modifiedCount > 0) {
                console.log(`Migration v333: Converted null '${field}' to empty array in ${result.modifiedCount} messages`);
            }
        }

        console.log('Migration v333: Completed fixing null fields in Slack-imported messages');
    },
});
