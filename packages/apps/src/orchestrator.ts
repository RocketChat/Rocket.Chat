import type { IAppServerOrchestrator } from './IAppServerOrchestrator';

export let Apps: IAppServerOrchestrator | undefined;

export function registerOrchestrator(orch: IAppServerOrchestrator): void {
	Apps = orch;
}
