import type { IAppServerOrchestrator } from './IAppServerOrchestrator';

let app: IAppServerOrchestrator | undefined;

type Orchestrator = { self: undefined } | (IAppServerOrchestrator & { self: IAppServerOrchestrator });

export const Apps = new Proxy<Orchestrator>({} as Orchestrator, {
	get: (_target, nameProp: keyof IAppServerOrchestrator | 'self'): any => {
		if (nameProp === 'self') {
			return app;
		}

		if (!app) {
			throw new Error(`Orchestrator not found`);
		}

		const prop = app[nameProp];

		if (typeof prop === 'function') {
			return prop.bind(app);
		}

		return prop;
	},
});

export function registerOrchestrator(orch: IAppServerOrchestrator): void {
	app = orch;
}
