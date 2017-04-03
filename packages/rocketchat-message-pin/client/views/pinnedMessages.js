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
	return this.autorun((function(_this) {
		return function() {
			const data = Template.currentData();
			return _this.subscribe('pinnedMessages', data.rid, _this.limit.get(), function() {
				if (PinnedMessage.find({
					rid: data.rid
				}).count() < _this.limit.get()) {
					return _this.hasMore.set(false);
				}
			});
		};
	})(this));
});

Template.pinnedMessages.events({
	'click .message-cog'(e, t) {
		let actions, dropDown, el, message, message_id;
		e.stopPropagation();
		e.preventDefault();
		message_id = $(e.currentTarget).closest('.message').attr('id');
		RocketChat.MessageAction.hideDropDown();
		t.$(`\#${ message_id } .message-dropdown`).remove();
		message = PinnedMessage.findOne(message_id);
		actions = RocketChat.MessageAction.getButtons(message, 'pinned');
		el = Blaze.toHTMLWithData(Template.messageDropdown, {
			actions
		});
		t.$(`\#${ message_id } .message-cog-container`).append(el);
		dropDown = t.$(`\#${ message_id } .message-dropdown`);
		return dropDown.show();
	},
	'scroll .content': _.throttle(function(e, instance) {
		if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight && instance.hasMore.get()) {
			return instance.limit.set(instance.limit.get() + 50);
		}
	}, 200)
});
