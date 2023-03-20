import { Meteor } from 'meteor/meteor';

import { updateCustomUserStatus } from '../lib/customUserStatus';
import { Notifications } from '../../../notifications/client';

Meteor.startup(() => Notifications.onLogged('updateCustomUserStatus', (data) => updateCustomUserStatus(data.userStatusData)));
