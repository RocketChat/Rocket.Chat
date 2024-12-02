import { Meteor } from 'meteor/meteor';

import { Subscriptions } from '../../../app/models/client';

export const toggleFavoriteRoom = (roomId: string, favorite: boolean) => {
	const userId = Meteor.userId()!;

	Subscriptions.update(
		{
			'rid': roomId,
			'u._id': userId,
		},
		{
			$set: {
				f: favorite,
			},
		},
	);
};
