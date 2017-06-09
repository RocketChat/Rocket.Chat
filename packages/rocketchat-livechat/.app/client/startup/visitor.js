import visitor from '../../imports/client/visitor';

Meteor.startup(() => {
	if (!localStorage.getItem('rocketChatLivechat')) {
		localStorage.setItem('rocketChatLivechat', Random.id());
	} else {
		Tracker.autorun(c => {
			if (!visitor.getId() && visitor.getToken()) {
				Meteor.call('livechat:loginByToken', visitor.getToken(), (err, result) => {
					if (result && result._id) {
						visitor.setId(result._id);
						c.stop();
					}
				});
			}
		});
	}
});
