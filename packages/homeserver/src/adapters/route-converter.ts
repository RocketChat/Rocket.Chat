import type { Request, Response } from 'express';
import type { RouteDefinition } from '../types';

export interface ElysiaContext {
	body?: any;
	query?: Record<string, any>;
	params?: Record<string, any>;
	headers?: Record<string, string>;
	set: {
		status: (code: number) => void;
		headers: Record<string, string>;
	};
}

export interface ElysiaRoute {
	method: string;
	path: string;
	handler: (context: ElysiaContext) => Promise<any>;
	validation?: {
		body?: any;
		params?: any;
		query?: any;
	};
}

/**
 * Convert Elysia-style routes to Express-compatible route definitions
 */
export class RouteConverter {
	/**
	 * Convert an Elysia route to a RouteDefinition
	 */
	static convertRoute(elysiaRoute: ElysiaRoute): RouteDefinition {
		return {
			method: elysiaRoute.method.toUpperCase() as any,
			path: this.convertPath(elysiaRoute.path),
			handler: this.createExpressHandler(elysiaRoute.handler),
			options: {
				authRequired: false, // Will be determined by route
				validateBody: elysiaRoute.validation?.body,
				validateParams: elysiaRoute.validation?.params,
			},
		};
	}

	/**
	 * Convert Elysia path parameters to Express format
	 * e.g., "/users/:userId" stays the same
	 * but "/{userId}" becomes "/:userId"
	 */
	private static convertPath(path: string): string {
		return path.replace(/\{([^}]+)\}/g, ':$1');
	}

	/**
	 * Create an Express-compatible handler from an Elysia handler
	 */
	private static createExpressHandler(
		elysiaHandler: (context: ElysiaContext) => Promise<any>
	): (req: Request, res: Response) => Promise<void> {
		return async (req: Request, res: Response) => {
			// Create Elysia-compatible context
			const context: ElysiaContext = {
				body: req.body,
				query: req.query as Record<string, any>,
				params: req.params,
				headers: req.headers as Record<string, string>,
				set: {
					status: (code: number) => {
						res.status(code);
					},
					headers: {},
				},
			};

			// Track headers set in context
			const originalHeaders = context.set.headers;
			context.set.headers = new Proxy(originalHeaders, {
				set(target, prop, value) {
					res.setHeader(String(prop), value);
					return Reflect.set(target, prop, value);
				},
			});

			try {
				// Call the Elysia handler
				const result = await elysiaHandler(context);

				// Send the response
				if (result !== undefined) {
					res.json(result);
				} else if (!res.headersSent) {
					res.end();
				}
			} catch (error) {
				// Handle errors
				if (!res.headersSent) {
					res.status(500).json({
						error: error instanceof Error ? error.message : 'Internal server error',
					});
				}
			}
		};
	}

	/**
	 * Convert multiple routes at once
	 */
	static convertRoutes(elysiaRoutes: ElysiaRoute[]): RouteDefinition[] {
		return elysiaRoutes.map(route => this.convertRoute(route));
	}
}