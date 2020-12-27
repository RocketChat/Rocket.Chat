import { UsersRaw } from '../../../app/models/server/raw/Users';
import { USER_STATUS } from '../../../definition/UserStatus';

interface IModelsParam {
	Users: UsersRaw;
}

interface IUpdateUserStatusParam {
	models: IModelsParam;
	userId: string;
	status?: USER_STATUS;
	statusProcessor?: Function;
}

export const processUserStatus = (current: USER_STATUS, status: USER_STATUS = USER_STATUS.OFFLINE): { status: USER_STATUS; statusConnection: USER_STATUS } => ({ status, statusConnection: current });

export async function handleUserPresenceAndStatus({ models: { Users }, userId, status, statusProcessor = processUserStatus }: IUpdateUserStatusParam): Promise<any> {
	const user = await Users.findOne({ _id: userId });

	if (!user) {
		return Promise.resolve();
	}

	const { status: processedStatus, statusConnection } = statusProcessor(status, user.statusDefault);

	const query = {
		_id: userId,
		$or: [
			{ status: { $ne: processedStatus } },
			{ statusConnection: { $ne: statusConnection } },
		],
	};

	const update = {
		$set: {
			status: processedStatus,
			statusConnection,
		},
	};

	const result = await Users.update(query, update);

	return {
		user,
		result,
		status: processedStatus,
		statusConnection,
	};
}
