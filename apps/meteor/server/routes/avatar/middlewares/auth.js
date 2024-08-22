import { userCanAccessAvatar, renderSVGLetters } from '../utils';

// protect all avatar endpoints
export const protectAvatars = async (req, res, next) => {
	if (!(await userCanAccessAvatar(req))) {
		let roomOrUsername;

		if (req.url.startsWith('/room')) {
			roomOrUsername = req.url.split('/')[2] || 'Room';
		} else {
			roomOrUsername = req.url.split('/')[1] || 'Anonymous';
		}

		res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
		res.write(renderSVGLetters(roomOrUsername, 200));
		res.end();

		return;
	}

	return next();
};
