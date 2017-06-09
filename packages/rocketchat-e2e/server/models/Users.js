RocketChat.models.Users.addKeyToChain = function(key) {
	const userId = Meteor.userId();
	const query = { _id: userId };
	this.update(query, { $set: { 'lastUsedIdentityKey': key.identityKey } });
	this.update(query, { $addToSet: { 'publicKeychain' : [ key.identityKey, key.signedPreKey, key.signedPreKeySignature, key.preKey ] } });
	console.log(this.findOne({ _id: userId }));
};

// RocketChat.models.Users.fetchKeyChain = function(_id, otrAck) {
// 	const query = { _id };
// 	const update = { $set: { otrAck } };
// 	return this.update(query, update);
// };
