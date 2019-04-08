/* globals CustomFields */
import { Meteor } from 'meteor/meteor';

Meteor.startup(function() {
	CustomFields.init();
});
