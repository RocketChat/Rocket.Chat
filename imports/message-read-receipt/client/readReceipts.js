import { ReactiveVar } from 'meteor/reactive-var';
import moment from 'moment';

import './readReceipts.html';

Template.readReceipts.helpers({
	receipts() {
		return Template.instance().readReceipts.get();
	},
	user() {
		return this.user.name || this.user.username;
	},
	time() {
		return moment(this.ts).format('L LTS');
	}
});

Template.readReceipts.onCreated(function readReceiptsOnCreated() {
	this.loading = new ReactiveVar(false);
	this.readReceipts = new ReactiveVar([]);
});

Template.readReceipts.onRendered(function readReceiptsOnRendered() {
	this.loading.set(true);
	Meteor.call('getReadReceipts', { messageId: this.data.messageId }, (error, result) => {
		this.loading.set(false);
		this.readReceipts.set(result);
	});
});
