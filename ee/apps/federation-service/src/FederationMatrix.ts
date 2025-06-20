import { type IFederationMatrixService, ServiceClass } from '@rocket.chat/core-services';

export class FederationMatrix extends ServiceClass implements IFederationMatrixService {
	protected name = 'federation-matrix';

	constructor() {
		super();
	}

    async created(): Promise<void> {
        console.log('Federation service created');
    }

	async started(): Promise<void> {
        console.log('Federation service started');
    }

    ping(): void {
        console.log('Federation service ping');
    }
}