import { Subscriptions } from '../../stores';

export const toggleFavoriteRoom = (roomId: string, favorite: boolean, userId: string | undefined) => {
	if (!userId) {
		return;
	}

	Subscriptions.state.update(
		(record) => record.rid === roomId && record.u._id === userId,
		(record) => ({ ...record, f: favorite }),
	);
};
