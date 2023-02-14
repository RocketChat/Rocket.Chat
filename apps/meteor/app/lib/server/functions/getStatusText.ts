import { Users } from '../../../models/server';

export const getStatusText = function (userId: string): string | undefined {
	if (!userId) {
		return;
	}

	const fields = {
		statusText: 1,
	};

	const options = {
		fields,
		limit: 1,
	};

	const data = Users.findOneById(userId, options);
	return data?.statusText;
};
