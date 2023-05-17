import { AppEvents } from '../../../ee/client/apps/communication';
import { AppClientOrchestratorInstance } from '../../../ee/client/apps/orchestrator';

type ListenersMapping = {
	readonly [P in keyof typeof AppEvents]?: (...args: any[]) => void;
};

export const registerListeners = (listeners: ListenersMapping): (() => void) => {
	const entries = Object.entries(listeners) as Exclude<
		{
			[K in keyof ListenersMapping]: [K, ListenersMapping[K]];
		}[keyof ListenersMapping],
		undefined
	>[];
	for (const [event, callback] of entries) {
		AppClientOrchestratorInstance.getWsListener()?.registerListener(AppEvents[event], callback);
	}
	return (): void => {
		for (const [event, callback] of entries) {
			AppClientOrchestratorInstance.getWsListener()?.unregisterListener(AppEvents[event], callback);
		}
	};
};
