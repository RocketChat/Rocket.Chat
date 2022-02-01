import { Meteor } from 'meteor/meteor';

import { MessageTypes } from '../../ui-utils/client';

Meteor.startup(() => {
    MessageTypes.registerType({
        id: 'user_joined_otr',
        system: true,
        message: 'user_joined_otr',
    });
});