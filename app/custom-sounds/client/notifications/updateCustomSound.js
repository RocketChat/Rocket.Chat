import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { Notifications } from '../../../notifications';
import { CustomSounds } from '../lib/CustomSounds';

Meteor.startup(() => Tracker.autorun(() => Meteor.userId() && Notifications.onAll('updateCustomSound', (data) => CustomSounds.update(data.soundData))));
