import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';
import { ReactiveVar } from 'meteor/reactive-var';
import './livechatDashboard.html';


const LivechatLocation = new Mongo.Collection('livechatLocation');

Template.livechatDashboard.helpers({
	userLocation() {
		return Template.instance().users.get();
	},
});

Template.livechatDashboard.onCreated(function() {
	this.users = new ReactiveVar([]);
	// TODO: Use filters later
	this.autorun(() => {
		const sub = this.subscribe('livechat:location');
		if (sub.ready()) {
			const users = LivechatLocation.find({}).map((data) => data);
			if (users && users.length > 0) {
				this.users.set(users);
			}
		}
	});
});
