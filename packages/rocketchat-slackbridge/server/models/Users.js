RocketChat.models.Users.setSlack = function(_id, slack) {
	return this.update({ _id: _id }, { $set: { 'settings.slack': slack }});
};
