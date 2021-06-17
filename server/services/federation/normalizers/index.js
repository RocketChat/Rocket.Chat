import message from './message';
import room from './room';
import subscription from './subscription';
import user from './user';

export const normalizers = {
	...message,
	...room,
	...subscription,
	...user,
};
