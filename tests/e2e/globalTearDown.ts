import { Users } from '../../app/models/server';

export default async (): Promise<void> => {
	console.log('[Info] deleting normal user after test');
	Users.findOneByIdOrUsername('normal_user');
};
