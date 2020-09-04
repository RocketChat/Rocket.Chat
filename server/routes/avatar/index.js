import { WebApp } from 'meteor/webapp';

import { roomAvatar } from './room';
import { userAvatar } from './user';
import { Authorization } from '../../sdk';

import './middlewares';

WebApp.connectHandlers.use('/avatar/room/', roomAvatar);
WebApp.connectHandlers.use('/avatar/', userAvatar);

// TODO: remove - testing purposes only
WebApp.connectHandlers.use('/sdk/', async (req, res) => {
	const result = await Authorization.hasPermission(req.query.name, 'lero');

	console.log('result ->', result);

	return res.end('done');
});
