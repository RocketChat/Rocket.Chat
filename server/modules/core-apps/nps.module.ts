import { IUiKitCoreApp } from '../../sdk/types/IUiKitCoreApp';

export class Nps implements IUiKitCoreApp {
	appId = 'nps-core';

	async blockAction(payload: any): Promise<any> {
		console.log('blockAction ->', payload);

		return { ok: 'for real' };
	}

	viewClosed(payload: any): Promise<any> {
		throw new Error('Method not implemented.');
	}

	viewSubmit(payload: any): Promise<any> {
		throw new Error('Method not implemented.');
	}
}
