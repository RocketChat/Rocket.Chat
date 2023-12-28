import { Meteor } from 'meteor/meteor';

import { Notifications } from '../../../notifications/client';
import { deleteCustomUserStatus } from '../lib/customUserStatus';

Meteor.startup(() => Notifications.onLogged('deleteCustomUserStatus', (data) => deleteCustomUserStatus(data.userStatusData)));
