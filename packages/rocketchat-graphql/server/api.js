import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { JSAccountsContext as jsAccountsContext } from 'kamilkisiela-graphql-api';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';

import { executableSchema } from './schema';

// the Meteor GraphQL server is an Express server
const graphQLServer = express();

graphQLServer.use(cors());
graphQLServer.use(bodyParser.urlencoded({ extended: true }));

graphQLServer.use(
	'/graphql',
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

graphQLServer.use('/graphiql', graphiqlExpress({
	endpointURL: '/graphql',
	subscriptionsEndpoint: 'ws://localhost:3000/subscriptions'
}));

new SubscriptionServer({
	schema: executableSchema,
	execute,
	subscribe
},
{
	path: '/subscriptions',
	server: WebApp.httpServer
});

// this binds the specified paths to the Express server running Apollo + GraphiQL
WebApp.connectHandlers.use(graphQLServer);
