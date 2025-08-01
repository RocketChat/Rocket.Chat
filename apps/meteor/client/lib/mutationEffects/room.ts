import { Subscriptions } from '../../../app/models/client';

export const toggleFavoriteRoom = (roomId: string, favorite: boolean, userId: string | null) => {
	if (!userId) {
		return;
	}

	Subscriptions.state.update(
		(record) => record.rid === roomId && record.u._id === userId,
		(record) => ({ ...record, f: favorite }),
	);
};
