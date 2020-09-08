import { ServiceClass } from '../../../../server/sdk/types/ServiceClass';
import { api } from '../../../../server/sdk/api';
import { ILicense } from '../../../../server/sdk/types/ILicense';
import { hasLicense, isEnterprise, getModules } from './license';

class License extends ServiceClass implements ILicense {
	protected name = 'license';

	hasLicense(feature: string): boolean {
		return hasLicense(feature);
	}

	isEnterprise(): boolean {
		return isEnterprise();
	}

	getModules(): string[] {
		return getModules();
	}
}

api.registerService(new License());
