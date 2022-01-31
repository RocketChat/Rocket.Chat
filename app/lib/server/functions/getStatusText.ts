import { Users } from '../../../models/server';

export const getStatusText = function (userId: string): unknown {
	if (!userId) {
		return undefined;
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
