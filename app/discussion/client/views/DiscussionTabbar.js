import _ from 'underscore';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { messageContext } from '../../../ui-utils/client/lib/messageContext';
import { DiscussionOfRoom } from '../lib/discussionsOfRoom';

import './DiscussionTabbar.html';

Template.discussionsTabbar.helpers({
	hasMessages() {
		return Template.instance().cursor.count() > 0;
	},
	messages() {
		return Template.instance().cursor;
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
	this.cursor = DiscussionOfRoom.find({
		rid: this.rid,
	}, {
		sort: {
			ts: -1,
		},
	});
	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(50);

	this.autorun(() => {
		const { rid } = Template.currentData();
		this.subscribe('discussionsOfRoom', rid, this.limit.get(), () => {
			const discussionCount = this.cursor.count();
			if (discussionCount < this.limit.get()) {
				this.hasMore.set(false);
			}
		});
	});
});

Template.discussionsTabbar.events({
	'scroll .js-list': _.throttle(function(e, instance) {
		if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight - 10 && instance.hasMore.get()) {
			instance.limit.set(instance.limit.get() + 50);
		}
	}, 200),
});
