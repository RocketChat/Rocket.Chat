import { ReactiveVar } from 'meteor/reactive-var';
import moment from 'moment';

import './readReceipts.css';
import './readReceipts.html';

Template.readReceipts.helpers({
	receipts() {
		return Template.instance().readReceipts.get();
	},
	displayName() {
		return (RocketChat.settings.get('UI_Use_Real_Name') && this.user.name) || this.user.username;
	},
	time() {
		return moment(this.ts).format('L LTS');
	},
	isLoading() {
		return Template.instance().loading.get();
	}
});

Template.readReceipts.onCreated(function readReceiptsOnCreated() {
	this.loading = new ReactiveVar(false);
	this.readReceipts = new ReactiveVar([]);
});

Template.readReceipts.onRendered(function readReceiptsOnRendered() {
	this.loading.set(true);
	Meteor.call('getReadReceipts', { messageId: this.data.messageId }, (error, result) => {
		if (!error) {
			this.readReceipts.set(result);
		}
		this.loading.set(false);
	});
});
