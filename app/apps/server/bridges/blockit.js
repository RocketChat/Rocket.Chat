import { Meteor } from 'meteor/meteor';
import express from 'express';
import { WebApp } from 'meteor/webapp';

const apiServer = express();

apiServer.disable('x-powered-by');

// const router = apiServer.router();

WebApp.connectHandlers.use(apiServer);

export class AppBlockitBridge {
	constructor(orch) {
		this.orch = orch;
		// this.appActions = new Map();

		// this.appActions.set('meu_app', {
		// 	outra_action: (req) => ({
		// 		triggerId: req.body.triggerId,
		// 		success: true,
		// 		type: 'modal', // modal, home
		// 		title: {
		// 			type: 'text_plain',
		// 			text: 'Hello Meu App',
		// 		},
		// 		submit: {
		// 			type: 'text_plain',
		// 			text: 'Amazing Ok',
		// 		},
		// 		close: {
		// 			type: 'text_plain',
		// 			text: 'Cancel :/',
		// 		},
		// 		blocks: [
		// 			{
		// 				type: 'section',
		// 				text: {
		// 					type: 'plain_text',
		// 					text: 'This is a plain text section block.',
		// 					emoji: true,
		// 				},
		// 			},
		// 			{
		// 				type: 'image',
		// 				title: {
		// 					type: 'plain_text',
		// 					text: 'Example Image',
		// 					emoji: true,
		// 				},
		// 				imageUrl: 'https://api.slack.com/img/blocks/bkb_template_images/goldengate.png',
		// 				altText: 'Example Image',
		// 			},But
		// 			{
		// 				type: 'actions',
		// 				elements: [
		// 					{
		// 						type: 'button',
		// 						text: {
		// 							type: 'plain_text',
		// 							text: 'OK',
		// 							emoji: true,
		// 						},
		// 					},
		// 				],
		// 			},
		// 		],

		// 	}),
		// });

		// apiServer.use('/api/apps', (req, res, next) => {
		// 	this.orch.debugLog({
		// 		method: req.method.toLowerCase(),
		// 		url: req.url,
		// 		query: req.query,
		// 		body: req.body,
		// 	});
		// 	next();
		// });

		apiServer.post('/api/apps/blockit/:appId', (req, res) => {
			// console.log('req ->', req);

			// const notFound = () => res.send(404);

			const {
				appId,
			} = req.params;

			const {
				actionId,
				triggerId,
				messageId,
				value,
			} = req.body;

			// const actions = this.appActions.get(appId);
			// if (!actions) {
			// 	return notFound();
			// }

			// if (!actions[actionId]) {
			// 	return notFound();
			// }

			// Promise.await(this.orch.getManager().getCommandManager().executeCommand(command, context));
			// this.orch.getManager().getCommandManager().executeCommand(command, context);

			// const result = this.orch.getManager().getBlockitManager().executeAction(appId, actionId);

			const action = {
				appId,
				actionId,
				messageId,
				triggerId,
				value,
			};
			const result = Promise.await(this.orch.getBridges().getListenerBridge().blockitEvent('IBlockitActionHandler', action));

			// const result = ;

			// console.log('manager ->', manager);


			// 	.then(({ status, headers = {}, content }) => {
			// 		res.set(headers);
			// 		res.status(status);
			// 		res.send(content);
			// 	})
			// 	.catch((reason) => {
			// 		// Should we handle this as an error?
			// 		res.status(500).send(reason.message);
			// 	});

			res.send(result);

			// router[method](routePath, Meteor.bindEnvironment(this._appApiExecutor(api, endpoint, appId)));
			// req._privateHash = req.params.hash;
			// return router(req, res, notFound);
		});
	}

	registerApi({ api, computedPath, endpoint }, appId) {
		this.orch.debugLog(`The App ${ appId } is registering the api: "${ endpoint.path }" (${ computedPath })`);

		this._verifyApi(api, endpoint);

		if (!this.appActions.get(appId)) {
			this.appActions.set(appId, express.Router()); // eslint-disable-line
		}

		const router = this.appActions.get(appId);

		const method = api.method || 'all';

		let routePath = endpoint.path.trim();
		if (!routePath.startsWith('/')) {
			routePath = `/${ routePath }`;
		}

		router[method](routePath, Meteor.bindEnvironment(this._appApiExecutor(api, endpoint, appId)));
	}

	unregisterApis(appId) {
		this.orch.debugLog(`The App ${ appId } is unregistering all apis`);

		if (this.appActions.get(appId)) {
			this.appActions.delete(appId);
		}
	}

	_verifyApi(api, endpoint) {
		if (typeof api !== 'object') {
			throw new Error('Invalid Api parameter provided, it must be a valid IApi object.');
		}

		if (typeof endpoint.path !== 'string') {
			throw new Error('Invalid Api parameter provided, it must be a valid IApi object.');
		}
	}

	_appApiExecutor(api, endpoint, appId) {
		return (req, res) => {
			const request = {
				method: req.method.toLowerCase(),
				headers: req.headers,
				query: req.query || {},
				params: req.params || {},
				content: req.body,
				privateHash: req._privateHash,
			};

			this.orch.getManager().getApiManager().executeApi(appId, endpoint.path, request)
				.then(({ status, headers = {}, content }) => {
					res.set(headers);
					res.status(status);
					res.send(content);
				})
				.catch((reason) => {
					// Should we handle this as an error?
					res.status(500).send(reason.message);
				});
		};
	}
}
