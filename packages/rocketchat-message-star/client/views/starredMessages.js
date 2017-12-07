/*globals StarredMessage */
import _ from 'underscore';

Template.starredMessages.helpers({
	hasMessages() {
		return StarredMessage.find({
			rid: this.rid
		}, {
			sort: {
				ts: -1
			}
		}).count() > 0;
	},
	messages() {
		return StarredMessage.find({
			rid: this.rid
		}, {
			sort: {
				ts: -1
			}
		});
	},
	message() {
		return _.extend(this, { customClass: 'starred', actionContext: 'starred'});
	},
	hasMore() {
		return Template.instance().hasMore.get();
	}
});

Template.starredMessages.onCreated(function() {
	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(50);
	this.autorun(() => {
		const sub = this.subscribe('starredMessages', this.data.rid, this.limit.get());
		const findStarredMessage = StarredMessage.find({ rid: this.data.rid });
		if (sub.ready()) {
			if (findStarredMessage.count() < this.limit.get()) {
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
	}, 200)
});
