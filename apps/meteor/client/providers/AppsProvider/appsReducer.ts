import type { AsyncState } from '../../lib/asyncState';
import { AsyncStatePhase } from '../../lib/asyncState';
import type { App } from '../../views/marketplace/types';

type State = AsyncState<{ apps: App[] }> & { reload: () => Promise<void> };
type Action =
	| { type: 'request' }
	| ((
			| { type: 'update'; app: App }
			| { type: 'success'; apps: App[] }
			| { type: 'failure'; error: Error }
			| { type: 'delete' | 'invalidate'; appId: string }
	  ) & { reload: () => Promise<void> });

const sortByName = (apps: App[]): App[] => apps.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));

export const appsReducer = (state: State, action: Action): State => {
	switch (action.type) {
		case 'invalidate':
			if (state.phase !== AsyncStatePhase.RESOLVED) {
				return state;
			}
			return {
				phase: AsyncStatePhase.RESOLVED,
				reload: action.reload,
				value: {
					apps: sortByName(
						state.value.apps.map((app) => {
							if (app.id === action.appId) {
								return { ...app };
							}
							return app;
						}),
					),
				},
				error: undefined,
			};
		case 'update':
			if (state.phase !== AsyncStatePhase.RESOLVED) {
				return state;
			}
			return {
				phase: AsyncStatePhase.RESOLVED,
				reload: action.reload,
				value: {
					apps: sortByName(
						state.value.apps.map((app) => {
							if (app.id === action.app.id) {
								return action.app;
							}
							return app;
						}),
					),
				},
				error: undefined,
			};
		case 'request':
			return {
				reload: async (): Promise<void> => undefined,
				phase: AsyncStatePhase.LOADING,
				value: undefined,
				error: undefined,
			};
		case 'success':
			return {
				reload: action.reload,
				phase: AsyncStatePhase.RESOLVED,
				value: { apps: sortByName(action.apps) },
				error: undefined,
			};
		case 'delete':
			if (state.phase !== AsyncStatePhase.RESOLVED) {
				return state;
			}
			return {
				reload: action.reload,
				phase: AsyncStatePhase.RESOLVED,
				value: { apps: state.value.apps.filter(({ id }) => id !== action.appId) },
				error: undefined,
			};
		case 'failure':
			return {
				reload: action.reload,
				phase: AsyncStatePhase.REJECTED,
				value: undefined,
				error: action.error,
			};
		default:
			return state;
	}
};
