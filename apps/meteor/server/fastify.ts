import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { chatSendMessageSchema, ChatGetThreadsListSchema, ChatGetThreadsListResponseSchema } from '@rocket.chat/rest-typings';
import Fastify from 'fastify';
import { WebApp } from 'meteor/webapp';

// eslint-disable-next-line new-cap
const fastify = Fastify({
	logger: true,
}).withTypeProvider<JsonSchemaToTsProvider>();

await fastify.register(import('@fastify/express'));

await fastify.register(import('@fastify/rate-limit'), {
	max: 100,
	timeWindow: '1 minute',
});

// eslint-disable-next-line new-cap
// const router = WebApp.express.Router();

WebApp.rawHandlers.use((req, res, next) => {
	const ff = fastify.findRoute(req);
	if (!ff) {
		next();
		return;
	}

	fastify.routing

	// router.on(opts.method, opts.url, { constraints }, routeHandler, context)

	const store = {};

	ff.handler(req, res, ff.params, store, ff.searchParams);

	console.log('store ->', store);

	// console.log('ff ->', ff);

	// next();
});

// router.get('/api/v2/lero', (req, res) => {
// 	console.log('lero ->', req);

// 	res.json({ ok: true });
// });

// fastify.use(router);

fastify.get(
	'/api/v2/chat.getThreadsList',
	{
		schema: {
			querystring: ChatGetThreadsListSchema,
			response: ChatGetThreadsListResponseSchema,
		},
	},
	async (request, reply) => {
		const { rid, type } = request.query;

		console.log({ rid, type });

		// if response doesn't match `ChatGetThreadsListResponseSchema` the response is send as an empty object
		await reply.send({ threads: [], total: 12 });
	},
);

// {
// 	type: 'object',
// 	properties: {
// 		message: {
// 			type: 'object',
// 			properties: {
// 				rid: { type: 'string' },
// 			},
// 		},
// 		previewUrls: {
// 			type: 'array',
// 			items: {
// 				type: 'string',
// 			},
// 			nullable: true,
// 		},
// 	},
// 	required: ['message'],
// 	additionalProperties: false,
// }

fastify.post(
	'/api/v2/chat.sendMessage',
	{
		schema: {
			body: chatSendMessageSchema,
		},
	},
	async (request, reply) => {
		const {
			message: { rid, msg },
		} = request.body;

		console.log('body ->', { rid, msg });

		await reply.send({ success: true });
	},
);

// fastify.route

// ????? change meteor default from 3000 => 4000 ?????

fastify.listen({ port: 3000 }, (err) => {
	if (err) throw err;
	console.log('Server listening at http://localhost:3030');
});
