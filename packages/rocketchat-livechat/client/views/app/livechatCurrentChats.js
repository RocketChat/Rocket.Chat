Template.livechatCurrentChats.helpers({
	livechatRoom() {
		return ChatRoom.find({ t: 'l' }, { sort: { ts: -1 } });
	},
	startedAt() {
		return moment(this.ts).format('L LTS');
	},
	lastMessage() {
		return moment(this.lm).format('L LTS');
	},
	name() {
		return 'Livechat ' + this.code;
	}
});

Template.livechatCurrentChats.events({
	'click .row-link'() {
		FlowRouter.go('live', { code: this.code });
	}
});

Template.livechatCurrentChats.onCreated(function() {
	this.subscribe('livechat:rooms');
});
