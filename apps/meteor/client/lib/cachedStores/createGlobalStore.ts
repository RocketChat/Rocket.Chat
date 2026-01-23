import type { StoreApi, UseBoundStore } from 'zustand';

import type { IDocumentMapStore } from './DocumentMapStore';

export const createGlobalStore = <T extends { _id: string }, U>(store: UseBoundStore<StoreApi<IDocumentMapStore<T>>>, extension?: U) =>
	Object.assign(
		{
			use: store,
			get state(): IDocumentMapStore<T> {
				return this.use.getState();
			},
		} as const,
		extension,
	);
