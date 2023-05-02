import type http from 'http';

import type { NextFunction } from 'connect';

import { userCanAccessAvatar } from '../utils';

// protect all avatar endpoints
export const protectAvatars = async (req: http.IncomingMessage, res: http.ServerResponse, next: NextFunction) => {
	if (!(await userCanAccessAvatar(req))) {
		res.writeHead(403);
		res.write('Forbidden');
		res.end();
		return;
	}

	return next();
};
