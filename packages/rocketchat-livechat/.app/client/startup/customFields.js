import { Meteor } from 'meteor/meteor';
import { CustomFields } from '../lib/CustomFields';

Meteor.startup(function() {
	CustomFields.init();
});
