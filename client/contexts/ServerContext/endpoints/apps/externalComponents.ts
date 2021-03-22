import { IExternalComponent } from '@rocket.chat/apps-engine/definition/externalComponent';

export type ExternalComponentsEndpoint = {
	GET: (params: Record<string, never>) => { externalComponents: IExternalComponent[] };
};
