import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { JSAccountsContext as jsAccountsContext } from '@accounts/graphql-api';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';

import { executableSchema } from './schema';

const subscriptionPort = RocketChat.settings.get('Graphql_Subscription_Port') || 3100;

// the Meteor GraphQL server is an Express server
const graphQLServer = express();

if (RocketChat.settings.get('Graphql_CORS')) {
	graphQLServer.use(cors());
}

graphQLServer.use(RocketChat.settings.get('Graphql_Endpoint'), (req, res, next) => {
	if (RocketChat.settings.get('Graphql_Enabled')) {
		next();
	} else {
		res.send(400, 'Graphql is not enabled in this server');
	}
});

graphQLServer.use(
	RocketChat.settings.get('Graphql_Endpoint'),
	bodyParser.json(),
	graphqlExpress(request => {
		return {
			schema: executableSchema,
			context: jsAccountsContext(request),
			formatError: e => ({
				message: e.message,
				locations: e.locations,
				path: e.path
			}),
			debug: Meteor.isDevelopment
		};
	})
);

graphQLServer.use(
	'/graphiql',
	graphiqlExpress({
		endpointURL: RocketChat.settings.get('Graphql_Endpoint'),
		subscriptionsEndpoint: `ws://localhost:${ subscriptionPort }`
	})
);

const startSubscriptionServer = () => {
	SubscriptionServer.create({
		schema: executableSchema,
		execute,
		subscribe,
		onConnect: (connectionParams) => ({ authToken: connectionParams.Authorization })
	},
	{
		port: subscriptionPort,
		host: process.env.BIND_IP || '0.0.0.0'
	});

	console.log('GraphQL Subscription server runs on port:', subscriptionPort);
};

WebApp.onListening(() => {
	if (RocketChat.settings.get('Graphql_Enabled')) {
		startSubscriptionServer();
	}
});

// this binds the specified paths to the Express server running Apollo + GraphiQL
WebApp.connectHandlers.use(graphQLServer);
