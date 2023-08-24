import type { MemoryHistory } from 'history';
import { createMemoryHistory } from 'history';
import type { CustomHistory } from 'preact-router';

export const createHistoryAdapter = (memoryHistory: MemoryHistory): CustomHistory => {
	return {
		listen: (callback) => memoryHistory.listen(({ location }) => callback(location)),
		location: memoryHistory.location,
		push: memoryHistory.push,
		replace: memoryHistory.replace,
	};
};

export const history = createHistoryAdapter(createMemoryHistory());

export default history;
