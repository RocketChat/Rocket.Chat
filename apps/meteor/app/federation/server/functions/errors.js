import { Meteor } from 'meteor/meteor';

export const disabled = (method) => new Meteor.Error('federation-error-disabled', 'Federation disabled', { method });

export const userNotFound = (query) => new Meteor.Error('federation-user-not-found', `Could not find federated users using "${query}"`);

export const peerNotFoundUsingDNS = (method) =>
	new Meteor.Error('federation-error-peer-no-found-using-dns', 'Could not find the peer using DNS or Hub', { method });

export const peerCouldNotBeRegisteredWithHub = (method) =>
	new Meteor.Error('federation-error-peer-could-not-register-with-hub', 'Could not register the peer using the Hub', { method });
