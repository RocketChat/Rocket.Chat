RocketChat.models.Users.addKeyToChain = function(key) {
	const userId = Meteor.userId();
	const query = { _id: userId };
	this.update(query, { $set: { 'lastUsedIdentityKey': key.identityKey } });
	this.update(query, { $addToSet: { 'publicKeychain' : [ key.identityKey, key.signedPreKey, key.signedPreKeySignature, key.preKey, key.registrationId ] } });
	// console.log(this.findOne({ _id: userId }));
};

RocketChat.models.Users.fetchKeychain = function(userId) {
	// const query = { _id: userId };
	// return this.update(query, update);
	const identityKey = this.findOne({ _id: userId }).lastUsedIdentityKey;
	const publicKeychain = this.findOne({ _id: userId }).publicKeychain;
	console.log(identityKey);
	console.log(publicKeychain);
	return JSON.stringify({ 'lastUsedIdentityKey': identityKey, 'publicKeychain': publicKeychain });
};
