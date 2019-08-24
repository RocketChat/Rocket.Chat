module.exports = (user) => ({
	isFederated: user.username.indexOf('@') !== -1,
});
