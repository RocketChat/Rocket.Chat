import { Meteor } from 'meteor/meteor';

module.exports = {
	disabled: (method) => new Meteor.Error('federation-error-disabled', 'Federation disabled', { method }),
	userNotFound: (query) => new Meteor.Error('federation-user-not-found', `Could not find federated users using "${ query }"`),
	peerNotFoundUsingDNS: (method) => new Meteor.Error('federation-error-peer-no-found-using-dns', 'Could not find the peer using DNS', { method }),
};
