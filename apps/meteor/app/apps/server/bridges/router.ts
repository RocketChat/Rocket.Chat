import express from 'express';

export const apiServer = express();

apiServer.disable('x-powered-by');

apiServer.use(
  '/api/apps/private/:appId/:hash',
  express.urlencoded({ extended: false }),
  express.json(),
);

apiServer.use(
  '/api/apps/public/:appId',
  express.urlencoded({ extended: false }),
  express.json(),
);
