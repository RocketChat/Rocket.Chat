declare module 'meteor/rocketchat:restivus-new' {
	class Restivus {
		constructor(options: unknown);

		corsHeaders: {
			'Access-Control-Allow-Origin': string;
			'Access-Control-Allow-Headers': string;
		};

		_routes: [];

		_config: {
			paths: string[];
			useDefaultAuth: boolean;
			apiPath: string;
			version: number | null;
			prettyJson: boolean;
			auth: {
				token: string;
				user(): { userId: string; token: string };
			};
			defaultHeaders: {
				'Content-Type': string;
			};
			enableCors: boolean;
		};

		// _.extend()
		// (method) UnderscoreStatic.extend(destination: any, ...sources: any[]): any
		extend(_config: Restivus['_config'], options: unknown): any;

		_initAuth(): this;

		/**
	Add endpoints for the given HTTP methods at the given path

	@param path {String} The extended URL path (will be appended to base path of the API)
	@param options {Object} Route configuration options
	@param options.authRequired {Boolean} The default auth requirement for each endpoint on the route
	@param options.roleRequired {String or String[]} The default role required for each endpoint on the route
	@param endpoints {Object} A set of endpoints available on the new route (get, post, put, patch, delete, options)
	@param endpoints.<method> {Function or Object} If a function is provided, all default route
			configuration options will be applied to the endpoint. Otherwise an object with an `action`
			and all other route config options available. An `action` must be provided with the object.
	*/

		addRoute(
			path: string,
			options: {
				authRequired: boolean;
				roleRequired: string;
			},
			endpoints: {
				'': unknown;
			},
		): this;

		addCollection(collection: unknown, options?: {}): this;

		_userCollectionEndpoints: {
			get(collection: unknown): {
				get: {
					action():
						| {
								status: string;
								data: unknown;
						  }
						| {
								statusCode: number;
								body: {
									status: string;
									message: string;
								};
						  };
				};
			};
			put(collection: unknown): {
				put: {
					action():
						| {
								status: string;
								data: unknown;
						  }
						| {
								statusCode: number;
								body: {
									status: string;
									message: string;
								};
						  };
				};
			};
			delete(collection: unknown): {
				delete: {
					action():
						| {
								status: string;
								data: {
									message: string;
								};
						  }
						| {
								statusCode: number;
								body: {
									status: string;
									message: string;
								};
						  };
				};
			};
			post(collection: unknown): {
				post: {
					action():
						| {
								statusCode: number;
								body: {
									status: string;
									data: unknown;
								};
						  }
						| {
								statusCode?: number;
								status: string;
								message: string;
						  };
				};
			};
			getAll(collection: unknown): {
				get: {
					action():
						| {
								status: string;
								data: unknown;
						  }
						| {
								statusCode: number;
								body: {
									status: string;
									message: string;
								};
						  };
				};
			};
		};

		_collectionEndpoints: {
			get(collection: unknown): {
				get: {
					action():
						| {
								status: string;
								data: unknown;
						  }
						| {
								statusCode: number;
								body: {
									status: string;
									message: string;
								};
						  };
				};
			};
			put(collection: unknown): {
				put: {
					action():
						| {
								status: string;
								data: unknown;
						  }
						| {
								statusCode: number;
								body: {
									status: string;
									message: string;
								};
						  };
				};
			};
			patch(collection: unknown): {
				patch: {
					action():
						| {
								status: string;
								data: unknown;
						  }
						| {
								statusCode: number;
								body: {
									status: string;
									message: string;
								};
						  };
				};
			};
			delete(collection: unknown): {
				delete: {
					action():
						| {
								status: string;
								data: {
									message: string;
								};
						  }
						| {
								statusCode: number;
								body: {
									status: string;
									message: string;
								};
						  };
				};
			};
			post(collection: unknown): {
				post: {
					action():
						| {
								statusCode: number;
								body: {
									status: string;
									data: unknown;
								};
						  }
						| {
								statusCode: number;
								body: {
									status: string;
									message: string;
								};
						  };
				};
			};
			getAll(collection: unknown): {
				get: {
					action():
						| {
								status: string;
								data: unknown;
						  }
						| {
								statusCode: number;
								body: {
									status: string;
									message: string;
								};
						  };
				};
			};
		};

		post():
			| {
					statusCode: string | number;
					body: {
						status: string;
						message: string;
					};
					status?: undefined;
					data?: undefined;
			  }
			| {
					status: string;
					data: undefined;
					statusCode?: undefined;
					body?: undefined;
			  };

		logout: () => {
			status: string;
			data: {
				message: string;
			};
		};
	}

	export = Restivus;
}
