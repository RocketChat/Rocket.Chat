import _ from 'underscore';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { messageContext } from '../../../ui-utils/client/lib/messageContext';
import { DiscussionOfRoom } from '../lib/discussionsOfRoom';

import './DiscussionTabbar.html';

Template.discussionsTabbar.helpers({
	hasMessages() {
		return Template.instance().cursor > 0;
	},
	messages() {
		Template.instance().cursor;
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
	return this.autorun(() => {
		const data = Template.currentData();
		return this.subscribe('discussionsOfRoom', data.rid, this.limit.get(), () => {
			if (DiscussionOfRoom.find({
				rid: data.rid,
			}).count() < this.limit.get()) {
				return this.hasMore.set(false);
			}
		});
	});
});

Template.discussionsTabbar.events({
	'scroll .js-list': _.throttle(function(e, instance) {
		if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight - 10 && instance.hasMore.get()) {
			return instance.limit.set(instance.limit.get() + 50);
		}
	}, 200),
});
