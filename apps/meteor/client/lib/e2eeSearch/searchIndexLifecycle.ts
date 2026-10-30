import type { SearchIndexSession, SearchIndexSessionSource } from './searchIndexSession';
import type { SearchIndexWriter } from './searchIndexWriter';

type SearchIndexLifecycleOptions = {
	session: Pick<SearchIndexSession, 'wipeClosed'>;
	source: Pick<SearchIndexSessionSource, 'getUserId'>;
	writer: Pick<SearchIndexWriter, 'flush'>;
	stopIndexing: () => Promise<void>;
};

export type SearchIndexLifecycle = {
	wipe(): Promise<boolean>;
	/** Return true from reset only after confirmation and a successful key reset. */
	resetKey(reset: () => Promise<boolean>): Promise<boolean>;
};

/** Delete reset data only after reset succeeds, without deleting another user's index. */
export const createSearchIndexLifecycle = ({
	session,
	source,
	writer,
	stopIndexing,
}: SearchIndexLifecycleOptions): SearchIndexLifecycle => {
	const wipe = () =>
		session.wipeClosed(async () => {
			await stopIndexing();
			await writer.flush({ throwOnError: true });
		});

	return {
		wipe,
		resetKey: async (reset) => {
			const userId = source.getUserId();
			if (!(await reset()) || !userId || source.getUserId() !== userId) return false;
			return wipe();
		},
	};
};
