import { getModules, getTags } from './license';
import { Analytics } from '../../../../server/sdk';

type ENTERPRISE_STATISTICS = {
	modules: string[];
	tags: string[];
	seatRequests: number;
};

export function getStatistics(): ENTERPRISE_STATISTICS {
	const modules = getModules();
	const tags = getTags().map(({ name }) => name);
	const seatRequests = Promise.await(Analytics.getSeatRequestCount());

	return {
		modules,
		tags,
		seatRequests,
	};
}
