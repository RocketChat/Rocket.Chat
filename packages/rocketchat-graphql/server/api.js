import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

import { executableSchema } from './schema';

// the Meteor GraphQL server is an Express server
const graphQLServer = express();

graphQLServer.use(cors());
graphQLServer.use(bodyParser.urlencoded({ extended: true }));

graphQLServer.use(
	'/graphql',
	bodyParser.json(),
	graphqlExpress(() => ({
		schema: executableSchema,
		context: {},
		formatError: e => ({
			message: e.message,
			locations: e.locations,
			path: e.path
		}),
		debug: Meteor.isDevelopment
	})));

graphQLServer.use('/graphiql', graphiqlExpress({
	endpointURL: '/graphql'
}));


// this binds the specified paths to the Express server running Apollo + GraphiQL
WebApp.connectHandlers.use(graphQLServer);
