import 'reflect-metadata';
import type { Request, Response, NextFunction } from 'express';
import type { HomeserverConfig, HomeserverInternalConfig, RouteDefinition } from '../types';
import { getAllRoutes } from '../controllers';
import type { RouteHandler, RouteContext } from '../controllers/base.controller';
import { HomeserverModuleLoader } from '../module-loader';

export class RocketChatAdapter {
	private moduleLoader: HomeserverModuleLoader;
	private initialized = false;

	constructor(private config: HomeserverConfig) {
		this.moduleLoader = new HomeserverModuleLoader();
	}

	async initialize(): Promise<void> {
		if (this.initialized) {
			return;
		}

		// Convert RC config to internal homeserver config
		const internalConfig: HomeserverInternalConfig = {
			serverName: this.config.domain,
			signingKey: '', // Will be loaded from file
			port: 8080, // Not used in monolith mode
		};

		// Initialize the module loader
		await this.moduleLoader.initialize(internalConfig);
		
		this.initialized = true;
	}

	/**
	 * Get route definitions that can be registered with Rocket.Chat's API system
	 */
	async getRoutes(): Promise<RouteDefinition[]> {
		if (!this.initialized) {
			throw new Error('Adapter not initialized. Call initialize() first.');
		}

		// Get routes from all controllers
		const homeserverRoutes = await getAllRoutes();
		
		// Convert to RC-compatible route definitions
		return homeserverRoutes.map(route => this.convertToRocketChatRoute(route));
	}

	/**
	 * Convert a homeserver route to a Rocket.Chat route definition
	 */
	private convertToRocketChatRoute(route: RouteHandler): RouteDefinition {
		return {
			method: route.method,
			path: route.path,
			handler: this.createRocketChatHandler(route.handler),
			options: {
				authRequired: route.options?.auth || false,
				rateLimit: route.options?.rateLimit,
			},
		};
	}

	/**
	 * Create a Rocket.Chat compatible handler from a homeserver handler
	 */
	private createRocketChatHandler(handler: (context: RouteContext) => Promise<any>): any {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				// Create a context that matches the homeserver's RouteContext interface
				const context: RouteContext = {
					params: req.params,
					query: req.query as Record<string, string>,
					body: req.body,
					headers: req.headers as Record<string, string>,
					set: {
						status: (code: number) => {
							res.status(code);
						},
						headers: (headers: Record<string, string>) => {
							Object.entries(headers).forEach(([key, value]) => {
								res.setHeader(key, value);
							});
						},
					},
				};

				// Call the handler
				const result = await handler(context);

				// Send the response
				if (result !== undefined) {
					res.json(result);
				} else if (!res.headersSent) {
					res.end();
				}
			} catch (error) {
				next(error);
			}
		};
	}

	/**
	 * Get specific services for direct access
	 */
	getServices() {
		if (!this.initialized) {
			throw new Error('Adapter not initialized. Call initialize() first.');
		}

		return {
			// Get services from the module loader
			getService: <T>(token: string) => this.moduleLoader.getService<T>(token),
			container: this.moduleLoader.getContainer(),
		};
	}

	/**
	 * Shutdown the adapter and clean up resources
	 */
	async shutdown(): Promise<void> {
		await this.moduleLoader.shutdown();
		this.initialized = false;
	}
}