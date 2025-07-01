import type { IFederationMatrixService } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';
import { isRunningMs } from '../../../server/lib/isRunningMs';
import { API } from '../../../app/api/server';

interface ExtendedContext {
	urlParams?: Record<string, string>;
	queryParams?: Record<string, any>;
	bodyParams?: Record<string, any>;
	request?: Request;
	_statusCode?: number;
	_headers?: Record<string, string>;
}

const logger = new Logger('FederationRoutes');

export async function registerFederationRoutes(federationService: IFederationMatrixService): Promise<void> {
	if (isRunningMs()) {
		return;
	}

	try {
		const routes = federationService.getAllRoutes();

		for (const route of routes) {
			const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';

			let router: any;
			if (route.path.startsWith('/_matrix')) {
				router = API._matrix;
			} else if (route.path.startsWith('/.well-known')) {
				router = API.wellKnown;
			} else if (route.path.startsWith('/internal')) {
				router = API.matrixInternal;
			} else {
				logger.error(`Unknown route prefix for path: ${route.path}`);
				continue;
			}

			if (method === 'patch') {
				if (typeof (router as any).method === 'function') {
					const routePath = route.path.replace(/^\/_matrix|^\/\.well-known|^\/internal/, '');
					(router as any).method('PATCH', routePath || '/', { response: {} }, async function (this: ExtendedContext) {
						try {
							const context = {
								params: this.urlParams || {},
								query: this.queryParams || {},
								body: this.bodyParams || {},
								headers: this.request?.headers ? Object.fromEntries(this.request.headers.entries()) : {},
								setStatus: (code: number) => {
									this._statusCode = code;
								},
								setHeader: (key: string, value: string) => {
									if (!this._headers) {
										this._headers = {};
									}
									this._headers[key] = value;
								},
							};

							const response = await route.handler(context);

							const result: any = {
								statusCode: this._statusCode || 200,
								body: response,
							};

							if (this._headers) {
								result.headers = this._headers;
							}

							return result;
						} catch (error) {
							logger.error(`Error handling route: ${route.path}`, error);
							return {
								statusCode: 500,
								body: { error: 'Internal server error' },
							};
						}
					});
					continue;
				} else {
					logger.error(`Cannot register PATCH method for route ${route.path} - method() function not available`);
					continue;
				}
			}

			if (typeof (router as any)[method] !== 'function') {
				logger.error(`Method ${method} not found on router for path: ${route.path}`);
				continue;
			}

			const routePath = route.path.replace(/^\/_matrix|^\/\.well-known|^\/internal/, '');

			(router as any)[method](routePath || '/', { response: {} }, async function (this: ExtendedContext) {
				try {
					const context = {
						params: this.urlParams || {},
						query: this.queryParams || {},
						body: this.bodyParams || {},
						headers: this.request?.headers ? Object.fromEntries(this.request.headers.entries()) : {},
						setStatus: (code: number) => {
							this._statusCode = code;
						},
						setHeader: (key: string, value: string) => {
							if (!this._headers) {
								this._headers = {};
							}
							this._headers[key] = value;
						},
					};

					const response = await route.handler(context);

					const result: any = {
						statusCode: this._statusCode || 200,
						body: response,
					};

					if (this._headers) {
						result.headers = this._headers;
					}

					return result;
				} catch (error) {
					logger.error(`Error handling route: ${route.path}`, error);
					return {
						statusCode: 500,
						body: { error: 'Internal server error' },
					};
				}
			});
		}

		logger.log('[Federation] Registered', routes.length, 'federation routes');
	} catch (error) {
		logger.error('[Federation] Failed to register routes:', error);
		throw error;
	}
}
