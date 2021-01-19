import { ServiceClass } from '../../sdk/types/ServiceClass';
import { INPSCoreApp } from '../../sdk/types/INPSCoreApp';

export class NpsCoreApp extends ServiceClass implements INPSCoreApp {
	protected name = 'nps-core-app';

	async blockAction(payload: any): Promise<any> {
		console.log('blockAction ->', payload);

		return { ok: true };
	}
}
