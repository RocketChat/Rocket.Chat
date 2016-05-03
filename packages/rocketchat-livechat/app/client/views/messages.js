Template.messages.helpers({
	messages: function() {
		return ChatMessage.find({
			rid: visitor.getRoom(),
			t: {
				'$ne': 't'
			}
		}, {
			sort: {
				ts: 1
			}
		});
	}
});

Template.messages.events({
	'keyup .input-message': function(event, instance) {
		instance.chatMessages.keyup(visitor.getRoom(), event, instance);
		instance.updateMessageInputHeight(event.currentTarget);
	},
	'keydown .input-message': function(event, instance) {
		return instance.chatMessages.keydown(visitor.getRoom(), event, instance);
	},
	'click .send-button': function(event, instance) {
		let input = instance.find('.input-message');
		let sent = instance.chatMessages.send(visitor.getRoom(), input);
		input.focus();
		instance.updateMessageInputHeight(input);

		return sent;
	},
	'click .new-message': function(event, instance) {
		instance.atBottom = true;
		return instance.find('.input-message').focus();
	},
	'click .error': function(event) {
		return $(event.currentTarget).removeClass('show');
	}
});

Template.messages.onCreated(function() {
	var self;
	self = this;

	self.atBottom = true;

	self.updateMessageInputHeight = function(input) {
		// Inital height is 28. If the scrollHeight is greater than that( we have more text than area ),
		// increase the size of the textarea. The max-height is set at 200
		// even if the scrollHeight become bigger than that it should never exceed that.
		// Account for no text in the textarea when increasing the height.
		// If there is no text, reset the height.
		let inputScrollHeight;
		inputScrollHeight = $(input).prop('scrollHeight');
		if (inputScrollHeight > 28) {
			return $(input).height($(input).val() === '' ? '15px' : (inputScrollHeight >= 200 ? inputScrollHeight - 50 : inputScrollHeight - 20));
		}
	};
});

Template.messages.onRendered(function() {
	this.chatMessages = new ChatMessages();
	this.chatMessages.init(this.firstNode);
});

Template.messages.onRendered(function() {
	var messages, newMessage, onscroll, template;
	messages = this.find('.messages');
	newMessage = this.find('.new-message');
	template = this;
	if (messages) {
		onscroll = _.throttle(function() {
			template.atBottom = messages.scrollTop >= messages.scrollHeight - messages.clientHeight;
		}, 200);
		Meteor.setInterval(function() {
			if (template.atBottom) {
				messages.scrollTop = messages.scrollHeight - messages.clientHeight;
				newMessage.className = 'new-message not';
			}
		}, 100);
		messages.addEventListener('touchstart', function() {
			template.atBottom = false;
		});
		messages.addEventListener('touchend', function() {
			onscroll();
		});
		messages.addEventListener('scroll', function() {
			template.atBottom = false;
			onscroll();
		});
		messages.addEventListener('mousewheel', function() {
			template.atBottom = false;
			onscroll();
		});
		messages.addEventListener('wheel', function() {
			template.atBottom = false;
			onscroll();
		});
	}
});
