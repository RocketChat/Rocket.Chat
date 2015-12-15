Template.livechatAppearance.helpers({
	sampleData () {
		return {
			color: RocketChat.settings.get('Livechat_title_color'),
			title: 'TITLE',
			messages: [
				{
					_id: Random.id(),
					u: {
						username: 'guest'
					},
					time: moment(this.ts).format('HH:mm'),
					date: moment(this.ts).format('LL'),
					body: 'Testing'
				}
			]
		};
	}
});
