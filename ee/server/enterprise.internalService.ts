import { ServiceClass } from '../../server/sdk/types/ServiceClass';
import { api } from '../../server/sdk/api';
import { IEnterprise, EnterpriseStatistics } from '../../server/sdk/types/IEnterprise';
import { validateUserRoles } from '../app/authorization/server/validateUserRoles';
import { getStatistics } from '../app/license/server/getStatistics';

class EnterpriseService extends ServiceClass implements IEnterprise {
	protected name = 'enterprise';

	protected internal = true;

	validateUserRoles(userId: string, userData: {_id: string; roles: string[]}): void {
		return validateUserRoles(userId, userData);
	}

	getStatistics(): EnterpriseStatistics {
		return getStatistics();
	}
}

api.registerService(new EnterpriseService());
