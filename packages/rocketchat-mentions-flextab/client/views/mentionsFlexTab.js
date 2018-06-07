/*globals MentionedMessage */
import _ from 'underscore';

Template.mentionsFlexTab.helpers({
	hasMessages() {
		return MentionedMessage.find({
			rid: this.rid
		}, {
			sort: {
				ts: -1
			}
		}).count() > 0;
	},
	messages() {
		return MentionedMessage.find({
			rid: this.rid
		}, {
			sort: {
				ts: -1
			}
		});
	},
	message() {
		return _.extend(this, { customClass: 'mentions', actionContext: 'mentions'});
	},
	hasMore() {
		return Template.instance().hasMore.get();
	}
});

Template.mentionsFlexTab.onCreated(function() {
	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(50);
	return this.autorun(() => {
		const mentionedMessageFind = MentionedMessage.find({ rid: this.data.rid });
		return this.subscribe('mentionedMessages', this.data.rid, this.limit.get(), () => {
			if (mentionedMessageFind.count() < this.limit.get()) {
				return this.hasMore.set(false);
			}
		});
	});
});

Template.mentionsFlexTab.events({
	'scroll .js-list': _.throttle(function(e, instance) {
		if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight && instance.hasMore.get()) {
			return instance.limit.set(instance.limit.get() + 50);
		}
	}, 200)
});
