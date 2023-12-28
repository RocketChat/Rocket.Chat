import { Meteor } from 'meteor/meteor';

import { Notifications } from '../../../notifications/client';
import { updateCustomUserStatus } from '../lib/customUserStatus';

Meteor.startup(() => Notifications.onLogged('updateCustomUserStatus', (data) => updateCustomUserStatus(data.userStatusData)));
