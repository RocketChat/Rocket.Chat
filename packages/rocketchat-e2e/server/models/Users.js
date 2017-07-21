RocketChat.models.Users.addKeyToChain = function(key) {
	const userId = Meteor.userId();
	const query = { _id: userId };
	this.update(query, { $set: { 'lastUsedIdentityKey': key.identityKey } });
	this.update(query, { $set: { 'RSA-PubKey': key['RSA-PubKey'] } });
	this.update(query, { $addToSet: { 'publicKeychain' : [ key.identityKey, key.signedPreKey, key.signedPreKeySignature, key.preKey, key.registrationId ] } });
	// console.log("Printing key contents");
	console.log(this.findOne({ _id: userId }));
};

RocketChat.models.Users.fetchKeychain = function(userId) {
	const identityKey = this.findOne({ _id: userId }).lastUsedIdentityKey;
	const publicKeychain = this.findOne({ _id: userId }).publicKeychain;
	const RSAPubKey = this.findOne({ _id: userId })['RSA-PubKey'];

	console.log(this.findOne({ _id: userId }));
	return JSON.stringify({ 'lastUsedIdentityKey': identityKey, 'RSA-PubKey': RSAPubKey, publicKeychain });
};

RocketChat.models.Users.emptyKeychain = function() {
	const userId = Meteor.userId();
	const query = { _id: userId };
	this.update(query, { $set: { 'lastUsedIdentityKey': '' } });
	this.update(query, { $set: { 'RSA-PubKey': '' } });
	this.update(query, { $set: { 'publicKeychain' : [ ] } });
};
