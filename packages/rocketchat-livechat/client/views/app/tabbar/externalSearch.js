Template.externalSearch.helpers({
	messages() {
		return RocketChat.models.LivechatExternalMessage.findByRoomId(this.rid, { ts: 1 });
	}
});

Template.externalSearch.events({
	'click a.pick-message'(event, instance) {
		event.preventDefault();

		$('#chat-window-' + instance.roomId + ' .input-message').val(this.msg).focus();
	}
});

Template.externalSearch.onCreated(function() {
	this.roomId = null;
	// console.log('externalSearch.this ->',this);
	this.autorun(() => {
		this.roomId = Template.currentData().rid;
		this.subscribe('livechat:externalMessages', Template.currentData().rid);
	});
});
