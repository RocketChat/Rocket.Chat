Template.livechatAppearance.helpers({
	previewState () {
		return Template.instance().previewState.get();
	},
	sampleData () {
		return {
			color: RocketChat.settings.get('Livechat_title_color'),
			title: RocketChat.settings.get('Livechat_title'),
			messages: [
				{
					_id: Random.id(),
					u: {
						username: 'guest'
					},
					time: moment(this.ts).format('HH:mm'),
					date: moment(this.ts).format('LL'),
					body: 'Hello',
					sequential: null
				},
				{
					_id: Random.id(),
					u: {
						username: 'rocketchat-agent'
					},
					time: moment(this.ts).format('HH:mm'),
					date: moment(this.ts).format('LL'),
					body: 'Hey, what can I help you with?',
					sequential: null
				},
				{
					_id: Random.id(),
					u: {
						username: 'guest'
					},
					time: moment(this.ts).format('HH:mm'),
					date: moment(this.ts).format('LL'),
					body: 'I\'m looking for informations about your product.',
					sequential: null
				},
				{
					_id: Random.id(),
					u: {
						username: 'rocketchat-agent'
					},
					time: moment(this.ts).format('HH:mm'),
					date: moment(this.ts).format('LL'),
					body: 'Our product is open source, you can do what you want with it! =D',
					sequential: null
				},
				{
					_id: Random.id(),
					u: {
						username: 'guest'
					},
					time: moment(this.ts).format('HH:mm'),
					date: moment(this.ts).format('LL'),
					body: 'Yay, thanks. That\'s awesome.',
					sequential: null
				},
				{
					_id: Random.id(),
					u: {
						username: 'rocketchat-agent'
					},
					time: moment(this.ts).format('HH:mm'),
					date: moment(this.ts).format('LL'),
					body: 'You\'re welcome.',
					sequential: null
				}
			]
		};
	}
});

Template.livechatAppearance.onCreated(function() {
	this.previewState = new ReactiveVar('opened');
});

Template.livechatAppearance.events({
	'change .preview-mode' (e, instance) {
		instance.previewState.set(e.currentTarget.value);
	}
})
