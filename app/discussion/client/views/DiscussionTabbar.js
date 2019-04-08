import _ from 'underscore';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { messageContext } from '../../../ui-utils/client/lib/messageContext';
import { DiscussionOfRoom } from '../lib/discussionsOfRoom';
import { Meteor } from 'meteor/meteor';

import './DiscussionTabbar.html';

Template.discussionsTabbar.helpers({
	noMessages() {
		return Template.instance().cursor.get().length === 0 ? true : false;
	},
	hasMessages() {
		return Template.instance().cursor.get().length > 0;
	},
	messages() {
		return Template.instance().cursor.get();
	},
	message() {
		return _.extend(this, { customClass: 'pinned', actionContext: 'pinned' });
	},
	hasMore() {
		return Template.instance().hasMore.get();
	},
	messageContext,
});

Template.discussionsTabbar.onCreated(function() {
	this.rid = this.data.rid;
	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(50);
	this.cursor = new ReactiveVar([]);
	this.autorun(() => {
		const data = Template.currentData();
		const handle = Meteor.subscribe('discussionsOfRoom', data.rid, this.limit.get());
		const isReady = handle.ready();
		// Wait for collection to be ready
		if (isReady) {
			const discussions = DiscussionOfRoom.find({
				rid: data.rid,
			}).fetch();
			this.cursor.set(discussions);
			if (discussions.length < this.limit.get()) {
				return this.hasMore.set(false);
			}
		}
	});
});

Template.discussionsTabbar.events({
	'scroll .js-list': _.throttle(function(e, instance) {
		if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight - 10 && instance.hasMore.get()) {
			return instance.limit.set(instance.limit.get() + 50);
		}
	}, 200),
});
