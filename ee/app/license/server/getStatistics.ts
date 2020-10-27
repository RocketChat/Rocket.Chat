import { getModules, getTags } from './license';

type ENTERPRISE_STATISTICS = {
	modules: string[];
	tags: string[];
}

export function getStatistics(): ENTERPRISE_STATISTICS {
	const modules = getModules();
	const tags = getTags().map(({ name }) => name);

	return {
		modules,
		tags,
	};
}
