import { WebApp } from 'meteor/webapp';
import express from 'express';
import type { Request, Response } from 'express';
import { Translation } from '@rocket.chat/core-services';

const app = express();

app.get('/i18n/:lng', async (req: Request, res: Response) => {
	const { lng } = req.params;
	const language = lng?.split('.').shift();

	if (!language) {
		res.writeHead(400);
		res.end();
		return;
	}

	try {
		const data = JSON.stringify(await Translation.getLanguageData(language));

		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Length', data.length);
		res.writeHead(200);
		res.end(data);
	} catch (error) {
		res.writeHead(400);
		res.end();
	}
});

app.get('/i18n/languages/available', async (_req: Request, res: Response) => {
	try {
		const data = await Translation.getSupportedLanguagesWithNames();

		res.status(200).json(data);
	} catch (error) {
		res.writeHead(400);
		res.end();
	}
});

WebApp.connectHandlers.use(app);
