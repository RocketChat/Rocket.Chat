// oxlint-disable no-undef
use('meteor');
db.getCollection('rocketchat_message').find({
	'content.algorithm': { $exists: true },
	'content.ciphertext': { $exists: true },
	't': { $eq: 'e2e' },
});
