import { Apps } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

Meteor.startup(async () => {
	// Find all the apps where marketplaceInfo is an array
	const apps = await Apps.find(
		{ marketplaceInfo: { $type: 'array' } },
		{
			projection: {
				marketplaceInfo: 1,
			},
		},
	).toArray();

	// For each app set the marketplaceInfo to be the first element of the array
	for await (const app of apps) {
		await Apps.update({ _id: app._id }, { $set: { marketplaceInfo: app.marketplaceInfo[0] } });
	}
});
