import express from 'express';
import { WebApp } from 'meteor/webapp';
import { join } from 'path';

const webhookServer = express();
WebApp.connectHandlers.use(webhookServer);

export class AppWebhooksBridge {
	constructor(orch) {
		this.orch = orch;
		this.appRouters = new Map();

		webhookServer.use('/apps/:appId', (req, res, next) => {
			const router = this.appRouters.get(req.params.appId);
			next = () => {
				res.send(404);
			};

			if (router) {
				return router(req, res, next);
			}

			next();
		});
	}

	registerWebhook(webhook, appId) {
		const path = join('/apps', appId, webhook.path);

		console.log(`The App ${ appId } is registerin the webhook: "${ webhook.path }" (${ path })`);

		this._verifyWebhook(webhook);

		if (!this.appRouters.get(appId)) {
			this.appRouters.set(appId, express.Router()); // eslint-disable-line
		}

		const router = this.appRouters.get(appId);

		const method = webhook.method || 'all';

		let routePath = webhook.path.trim();
		if (!routePath.startsWith('/')) {
			routePath = `/${ routePath }`;
		}

		router[method](routePath, Meteor.bindEnvironment(this._appWebhookExecutor(webhook, appId)));

		this.orch.getNotifier().webhookAdded(path);
	}

	unregisterWebhooks(appId) {
		console.log(`The App ${ appId } is unregistering all webhooks`);

		if (this.appRouters.get(appId)) {
			this.appRouters.delete(appId);
		}

		this.orch.getNotifier().webhookRemoved(appId);
	}

	_verifyWebhook(webhook) {
		if (typeof webhook !== 'object') {
			throw new Error('Invalid Webhook parameter provided, it must be a valid IWebhook object.');
		}

		if (typeof webhook.path !== 'string') {
			throw new Error('Invalid Webhook parameter provided, it must be a valid IWebhook object.');
		}
	}

	_appWebhookExecutor(webhook, appId) {
		return (req, res) => {
			const request = {
				method: req.method.toLowerCase(),
				headers: req.headers,
				query: req.query || {},
				params: req.params || {},
				content: req.body,
			};

			this.orch.getManager().getWebhookManager().executeWebhook(appId, webhook.path, request).then(({ status, headers = {}, content }) => {
				res.set(headers);
				res.status(status);
				res.send(content);
			});
		};
	}
}
