import AccountsServer from '@accounts/server';
import MongoAdapter from '@accounts/mongo';
import { MongoInternals } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
	const mongodb = MongoInternals.defaultRemoteCollectionDriver().mongo.db;

	const mongoAdapter = new MongoAdapter(mongodb, {
		convertUserIdToMongoObjectId: false
	});

	AccountsServer.config({
		tokenConfigs: {
			accessToken: {
				expiresIn: '3d'
			},
			refreshToken: {
				expiresIn: '30d'
			}
		},
		passwordHashAlgorithm: 'sha256'
	}, mongoAdapter);
});
