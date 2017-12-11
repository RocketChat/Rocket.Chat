this.visitorId = new ReactiveVar(null);

Meteor.startup(() => {
	if (!localStorage.getItem('rocketChatLivechat')) {
		localStorage.setItem('rocketChatLivechat', Random.id());
	} else {
		Tracker.autorun(c => {
			if (!Meteor.userId() && visitor.getToken()) {
				Meteor.call('livechat:loginByToken', visitor.getToken(), (err, result) => {
					if (result && result.token) {
						Meteor.loginWithToken(result.token, () => {
							c.stop();
						});
					}
				});
			}
		});
	}

	this.visitorId.set(localStorage.getItem('rocketChatLivechat'));
});
