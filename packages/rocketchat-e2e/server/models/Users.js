RocketChat.models.Users.addKeyToChain = function(key) {
	const userId = Meteor.userId();
	const query = { _id: userId };
	// this.update(query, { $set: { 'lastUsedIdentityKey': key.identityKey } });
	this.update(query, { $set: { 'RSA-PubKey': key['RSA-PubKey'] } });
	this.update(query, { $set: { 'RSA-EPrivKey': key['RSA-EPrivKey'] } });
	// this.update(query, { $addToSet: { 'publicKeychain' : [ key.identityKey, key.signedPreKey, key.signedPreKeySignature, key.preKey, key.registrationId ] } });
};

RocketChat.models.Users.fetchKeychain = function(userId) {
	// const identityKey = this.findOne({ _id: userId }).lastUsedIdentityKey;
	// const publicKeychain = this.findOne({ _id: userId }).publicKeychain;
	const RSAPubKey = this.findOne({ _id: userId })['RSA-PubKey'];
	return JSON.stringify({ 'RSA-PubKey': RSAPubKey });
};

RocketChat.models.Users.fetchMyKeys = function() {
	const userId = Meteor.userId();
	const RSAEPrivKey = this.findOne({ _id: userId })['RSA-EPrivKey'];
	const RSAPubKey = this.findOne({ _id: userId })['RSA-PubKey'];
	return JSON.stringify({ 'RSA-PubKey': RSAPubKey, 'RSA-EPrivKey': RSAEPrivKey });
};

RocketChat.models.Users.emptyKeychain = function() {
	const userId = Meteor.userId();
	const query = { _id: userId };
	this.update(query, { $set: { 'RSA-PubKey': '' } });
	this.update(query, { $set: { 'RSA-EPrivKey': '' } });
};
