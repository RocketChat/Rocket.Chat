import _ from 'underscore';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { DiscussionOfRoom } from '../lib/discussionsOfRoom';

import './DiscussionTabbar.html';

Template.discussionsTabbar.helpers({
	hasMessages() {
		return DiscussionOfRoom.find({
			rid: this.rid,
		}).count() > 0;
	},
	messages() {
		return DiscussionOfRoom.find({
			rid: this.rid,
		}, {
			sort: {
				ts: -1,
			},
		});
	},
	message() {
		return _.extend(this, { customClass: 'pinned', actionContext: 'pinned' });
	},
	hasMore() {
		return Template.instance().hasMore.get();
	},
});

Template.discussionsTabbar.onCreated(function() {
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
