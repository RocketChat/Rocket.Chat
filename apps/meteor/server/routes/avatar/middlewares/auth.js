import { userCanAccessAvatar } from '../utils';

// protect all avatar endpoints
export const protectAvatars = async (req, res, next) => {
	if (!(await userCanAccessAvatar(req))) {
		res.writeHead(403);
		res.write('Forbidden');
		res.end();
		return;
	}

	return next();
};
