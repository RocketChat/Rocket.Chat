RocketChat._setEmail = (userId, email) ->
	email = s.trim email
	if not userId or not email
		return false

	emailValidation = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
	if not emailValidation.test email
		return false

	user = RocketChat.models.Users.findOneById userId

	# User already has desired username, return
	if user.emails?[0]?.address is email
		return user

	# Check e-mail availability
	unless RocketChat.checkEmailAvailability email
		return false

	# Set new email
	RocketChat.models.Users.setEmail user._id, email
	user.email = email
	return user

RocketChat.setEmail = RocketChat.RateLimiter.limitFunction RocketChat._setEmail, 1, 60000,
	0: (userId) -> return not RocketChat.authz.hasPermission(userId, 'edit-other-user-info') # Administrators have permission to change others emails, so don't limit those
