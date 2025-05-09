import { Subscriptions } from '../../../app/models/client';

export const toggleFavoriteRoom = (roomId: string, favorite: boolean, userId: string | null) => {
	if (!userId) {
		return;
	}

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
