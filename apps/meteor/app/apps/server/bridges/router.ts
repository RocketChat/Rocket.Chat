import bodyParser from 'body-parser';
import express from 'express';

export const apiServer = express();

apiServer.disable('x-powered-by');

apiServer.use('/api/apps/private/:appId/:hash', bodyParser.urlencoded(), bodyParser.json());
apiServer.use('/api/apps/public/:appId', bodyParser.urlencoded(), bodyParser.json());
