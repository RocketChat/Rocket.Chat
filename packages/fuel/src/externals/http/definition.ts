import type http from 'http';

export abstract class ExternalHttpController {}

export type ExternalHttpRouterConfig = {
	cors: boolean;
	development: boolean;
	validateInput: boolean;
	transformInputWhenRequired: boolean;
	docs: {
		enabled: boolean;
		title: string;
		version: string;
		routePath: string;
		description?: string;
		securitySchemes?: Record<string, any>;
	};
};

// TODO: Remove the callback once we move away from Meteor, this is a limitation because we need to attach the server to WebApp,
// once we are out of Meteor, the Service should be responsible for setting up the server autonomously
export type ExternalHttpStartParams = { config: ExternalHttpRouterConfig; onUpdateCallback: (server: http.Server) => Promise<void> };
export interface IExternalHttpRouter {
	start(params: ExternalHttpStartParams): Promise<void>;
	registerController(controller: new (...args: any[]) => ExternalHttpController): void;
	registerControllers(controllers: (new (...args: any[]) => ExternalHttpController)[]): void;
	unregisterControllers(controllers: (new (...args: any[]) => ExternalHttpController)[]): void;
	refreshAPIInstance(): Promise<void>;
}
