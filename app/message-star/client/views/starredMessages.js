import _ from 'underscore';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { StarredMessage } from '../lib/StarredMessage';
import { messageContext } from '../../../ui-utils/client/lib/messageContext';

Template.starredMessages.helpers({
	hasMessages() {
		return Template.instance().cursor.count() > 0;
	},
	messages() {
		return Template.instance().cursor;
	},
	message() {
		return _.extend(this, { actionContext: 'starred' });
	},
	hasMore() {
		return Template.instance().hasMore.get();
	},
	messageContext,
});

Template.starredMessages.onCreated(function() {
	this.rid = this.data.rid;

	this.cursor = StarredMessage.find({
		rid: this.data.rid,
	}, {
		sort: {
			ts: -1,
		},
	});
	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(50);
	this.autorun(() => {
		const sub = this.subscribe('starredMessages', this.data.rid, this.limit.get());
		if (sub.ready()) {
			if (this.cursor.count() < this.limit.get()) {
				return this.hasMore.set(false);
			}
		}
	});
});

Template.starredMessages.events({
	'scroll .js-list': _.throttle(function(e, instance) {
		if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight) {
			return instance.limit.set(instance.limit.get() + 50);
		}
	}, 200),
});
