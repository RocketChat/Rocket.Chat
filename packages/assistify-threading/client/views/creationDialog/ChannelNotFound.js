import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

Template.ChannelNotFound.helpers({
	showMoreTopics() {
		const instance = Template.instance();
		return instance.channelsCount.get() > 10;
	},
});
Template.ChannelNotFound.onCreated(function() {
	const instance = this;
	instance.channelsCount = new ReactiveVar('');
	Meteor.call('getParentChannelList', { sort: 'name' }, function(err, result) {
		if (result) {
			instance.channelsCount.set(result.channels.length);
		}
	});
});
