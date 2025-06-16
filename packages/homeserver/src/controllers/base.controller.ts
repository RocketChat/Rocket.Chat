import type { Elysia } from 'elysia';

export interface RouteHandler {
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	path: string;
	handler: (context: RouteContext) => Promise<any>;
	options?: {
		auth?: boolean;
		rateLimit?: number;
	};
	elysiaConfig?: {
		params?: any;
		body?: any;
		query?: any;
		response?: any;
		detail?: {
			tags?: string[];
			summary?: string;
			description?: string;
		};
	};
}

export interface RouteContext {
	params: Record<string, string>;
	query: Record<string, string>;
	body: any;
	headers: Record<string, string>;
	set: {
		status: (code: number) => void;
		headers: (headers: Record<string, string>) => void;
	};
}

export abstract class BaseController {
	abstract getRoutes(): RouteHandler[];
	
	registerElysiaRoutes(app: Elysia): void {
		const routes = this.getRoutes();
		
		routes.forEach((route) => {
			const method = route.method.toLowerCase();
			const path = this.convertToElysiaPath(route.path);
			
			const elysiaHandler = async ({ params, query, body, headers, set }: any) => {
				const context: RouteContext = {
					params,
					query,
					body,
					headers,
					set,
				};
				
				return route.handler(context);
			};
			
			const options = {
				...route.options,
				...route.elysiaConfig,
			};
			
			switch (method) {
				case 'get':
					app.get(path, elysiaHandler, options);
					break;
				case 'post':
					app.post(path, elysiaHandler, options);
					break;
				case 'put':
					app.put(path, elysiaHandler, options);
					break;
				case 'delete':
					app.delete(path, elysiaHandler, options);
					break;
				case 'patch':
					app.patch(path, elysiaHandler, options);
					break;
			}
		});
	}
	
	private convertToElysiaPath(path: string): string {
		// Convert Express-style params to Elysia format
		// e.g., ":param" becomes "{param}"
		return path.replace(/:([^/]+)/g, '{$1}');
	}
}