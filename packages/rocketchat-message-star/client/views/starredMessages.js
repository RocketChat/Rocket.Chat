/*globals StarredMessage */
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
		return _.extend(this, {
			customClass: 'starred'
		});
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
	'click .message-cog'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		const message_id = $(e.currentTarget).closest('.message').attr('id');
		RocketChat.MessageAction.hideDropDown();
		t.$(`\#${ message_id } .message-dropdown`).remove();
		const message = StarredMessage.findOne(message_id);
		const actions = RocketChat.MessageAction.getButtons(message, 'starred');
		const el = Blaze.toHTMLWithData(Template.messageDropdown, {
			actions
		});
		t.$(`\#${ message_id } .message-cog-container`).append(el);
		const dropDown = t.$(`\#${ message_id } .message-dropdown`);
		return dropDown.show();
	},
	'scroll .content': _.throttle(function(e, instance) {
		if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight) {
			return instance.limit.set(instance.limit.get() + 50);
		}
	}, 200)
});
