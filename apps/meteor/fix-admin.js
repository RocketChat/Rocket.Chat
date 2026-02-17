import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';

Meteor.startup(() => {
  const user = Meteor.users.findOne({ username: 'NagajyothiChukka' });
  if (user) {
    Meteor.users.update(user._id, { $set: { roles: ['admin', 'livechat-agent', 'livechat-manager'] } });
    console.log('✅ Permissions updated for NagajyothiChukka');
  } else {
    console.log('❌ User not found');
  }
});
