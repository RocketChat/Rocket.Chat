import express from 'express';
import { WebApp } from 'meteor/webapp';
import { RegisterRoutes } from '@rocket.chat/rest-api';

import { Room } from '../sdk';

const apiServer = express();

WebApp.connectHandlers.use(apiServer);

// eslint-disable-next-line new-cap
const router = express.Router();

// eslint-disable-next-line new-cap
RegisterRoutes(router, { Room });

apiServer.use('/api/v2', router);
