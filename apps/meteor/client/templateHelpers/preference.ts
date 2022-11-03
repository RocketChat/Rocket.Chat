import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { getUserPreference } from '../../app/utils/client';

Template.registerHelper('preference', (name: string) => getUserPreference(Meteor.userId(), name));
