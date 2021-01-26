import { getModules, getTags } from './license';
import { EnterpriseStatistics } from '../../../../server/sdk/types/IEnterprise';

export function getStatistics(): EnterpriseStatistics {
	const modules = getModules();
	const tags = getTags().map(({ name }) => name);

	return {
		modules,
		tags,
	};
}
