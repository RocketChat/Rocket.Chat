declare module 'meteor/rocketchat:restivus' {
	type RestivusOptions = {
		onLoggedIn?: () => Record<string, any> | null;
		onLoggedOut?: () => Record<string, any> | null;
		useDefaultAuth?: boolean;
		auth?: {
			token: string;
			user: () => Promise<{ userId: string; token: string }>;
		};
		defaultHeaders?: Record<string, any>;
		prettyJson?: boolean;
		enableCors?: boolean;
		apiPath?: string;
		version?: string;
	};

	class Restivus {
		_config: RestivusOptions;

		request: Request;

		response: Response;

		bodyParams: { payload?: string };

		user: { _id: string };

		token: string;

		done: () => void;

		_routes: {
			path: string;
			options: Record<string, any>;
			endpoints: {
				endpoint: string;
				method: string;
			};
		}[];

		constructor(options: RestivusOptions);

		addRoute(route: string, options: Record<string, any>, endpoints: Record<string, any>): void;
	}

	type Response = {
		setHeader: (key: string, value: any) => void;
		writeHead: (status: number, data?: Record<string, any>) => void;
		write: (param: string) => void;
	};
	type Request = {
		headers: Record<string, any>;
		socket: string;
		connection?: { socket: { remoteAddress: string }; remoteAddress: string };
		route: string;
	};
}
