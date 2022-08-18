declare module 'meteor/rocketchat:oauth2-server' {
	import type { Mongo } from 'meteor/mongo';
	import type { HandleFunction } from 'connect';
	import type { Request, Response } from 'express';

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
