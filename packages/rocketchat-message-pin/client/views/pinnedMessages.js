/* globals PinnedMessage */
Template.pinnedMessages.helpers({
	hasMessages() {
		return PinnedMessage.find({
			rid: this.rid
		}, {
			sort: {
				ts: -1
			}
		}).count() > 0;
	},
	messages() {
		return PinnedMessage.find({
			rid: this.rid
		}, {
			sort: {
				ts: -1
			}
		});
	},
	message() {
		return _.extend(this, {
			customClass: 'pinned'
		});
	},
	hasMore() {
		return Template.instance().hasMore.get();
	}
});

Template.pinnedMessages.onCreated(function() {
	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(50);
	return this.autorun(() => {
		const data = Template.currentData();
		return this.subscribe('pinnedMessages', data.rid, this.limit.get(), () => {
			if (PinnedMessage.find({
				rid: data.rid
			}).count() < this.limit.get()) {
				return this.hasMore.set(false);
			}
		});
	});
});

Template.pinnedMessages.events({
	'click .message-cog'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		const message_id = $(e.currentTarget).closest('.message').attr('id');
		RocketChat.MessageAction.hideDropDown();
		t.$(`\#${ message_id } .message-dropdown`).remove();
		const message = PinnedMessage.findOne(message_id);
		const actions = RocketChat.MessageAction.getButtons(message, 'pinned');
		const el = Blaze.toHTMLWithData(Template.messageDropdown, {
			actions
		});
		t.$(`\#${ message_id } .message-cog-container`).append(el);
		const dropDown = t.$(`\#${ message_id } .message-dropdown`);
		return dropDown.show();
	},
	'scroll .content': _.throttle(function(e, instance) {
		if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight && instance.hasMore.get()) {
			return instance.limit.set(instance.limit.get() + 50);
		}
	}, 200)
});
