import { Meteor } from 'meteor/meteor';

import { deleteCustomUserStatus } from '../lib/customUserStatus';
import { Notifications } from '../../../notifications/client';

Meteor.startup(() => Notifications.onLogged('deleteCustomUserStatus', (data) => deleteCustomUserStatus(data.userStatusData)));
