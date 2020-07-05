import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Promise } from 'meteor/promise';
import { Tracker } from 'meteor/tracker';

const getRoomsByCountry = (name) => new Promise((resolve, reject) => {
	Meteor.call('getRoomsByCountry', name, (error, result) => {
		if (error) {
			reject(error);
		}
		resolve(result);
	});
});

Template.roomsList.onCreated(async function() {
	this.list = new ReactiveVar([]);
	Tracker.autorun(async () => {
		await getRoomsByCountry(FlowRouter.getParam('name'))
			.then((result) => {
				this.list.set(result);
			});
	});
});

Template.roomsList.helpers({
	getRooms() {
		const instance = Template.instance();
		return instance.list.get();
	},
	getParam() {
		return FlowRouter.getParam('name');
	},

});
