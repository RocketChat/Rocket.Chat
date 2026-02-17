import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { settings } from '../../app/settings/server';

Meteor.startup(async () => {
    console.log('--- STARTING ACCOUNT FIX ---');
    const user = await Meteor.users.findOneAsync({ username: 'NagajyothiChukka' });
    if (user) {
        await Roles.addUsersToRolesAsync(user._id, ['admin', 'livechat-manager', 'livechat-agent']);
        await settings.updateById('Livechat_enabled', true);
        console.log('✅ ALL_DONE_SUCCESSFULLY: NagajyothiChukka is now Admin and Omnichannel is Enabled');
    } else {
        console.log('❌ USER NOT FOUND: Check the spelling of NagajyothiChukka');
    }
});
