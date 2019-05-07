import _ from 'underscore';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { PinnedMessage } from '../lib/PinnedMessage';
import { messageContext } from '../../../ui-utils/client/lib/messageContext';

Template.pinnedMessages.helpers({
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

Template.pinnedMessages.onCreated(function() {
	this.rid = this.data.rid;

	this.cursor = PinnedMessage.find({
		rid: this.data.rid,
	}, {
		sort: {
			ts: -1,
		},
	});

	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(50);
	return this.autorun(() => {
		const data = Template.currentData();
		return this.subscribe('pinnedMessages', data.rid, this.limit.get(), () => {
			if (this.cursor.count() < this.limit.get()) {
				return this.hasMore.set(false);
			}
		});
	});
});

Template.pinnedMessages.events({
	'scroll .js-list': _.throttle(function(e, instance) {
		if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight && instance.hasMore.get()) {
			return instance.limit.set(instance.limit.get() + 50);
		}
	}, 200),
});
