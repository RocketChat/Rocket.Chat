declare module 'meteor/rocketchat:oauth2-server' {
	import { Mongo } from 'meteor/mongo';
	import { HandleFunction } from 'connect';
	import { Request, Response } from 'express';

	export class OAuth2Server {
		constructor(opts: {
			accessTokensCollectionName: string;
			refreshTokensCollectionName: string;
			authCodesCollectionName: string;
			clientsCollection: Mongo.Collection<unknown>;
			debug: boolean;
		});

		oauth: {
			model: {
				AccessTokens: Mongo.Collection<unknown>;
			};
		};

		app: HandleFunction & {
			disable(name: string): void;
		};

		routes: {
			disable(name: string): void;
			get(path: string, callback: (req: Request, res: Response) => void): void;
		};
	}
}
