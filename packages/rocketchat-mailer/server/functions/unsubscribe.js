/* globals Mailer */
Mailer.unsubscribe = function(_id, createdAt) {
	if (_id && createdAt) {
		return RocketChat.models.Users.rocketMailUnsubscribe(_id, createdAt) === 1;
	}
	return false;
};
