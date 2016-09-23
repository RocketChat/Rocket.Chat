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
	servedBy() {
		return this.servedBy && this.servedBy.username;
	},
	status() {
		return this.open ? t('Opened') : t('Closed');
	},
	agents() {
		return AgentUsers.find({}, { sort: { name: 1 } });
	}
});

Template.livechatCurrentChats.events({
	'click .row-link'() {
		FlowRouter.go('live', { code: this.code });
	},
	'click .load-more'(event, instance) {
		instance.limit.set(instance.limit.get() + 20);
	},
	'submit form'(event, instance) {
		event.preventDefault();

		let filter = {};
		$(':input', event.currentTarget).each(function() {
			if (this.name) {
				filter[this.name] = $(this).val();
			}
		});

		instance.filter.set(filter);
		instance.limit.set(20);
	}
});

Template.livechatCurrentChats.onCreated(function() {
	this.limit = new ReactiveVar(20);
	this.filter = new ReactiveVar({});

	this.subscribe('livechat:agents');

	this.autorun(() => {
		this.subscribe('livechat:rooms', this.filter.get(), 0, this.limit.get());
	});
});
