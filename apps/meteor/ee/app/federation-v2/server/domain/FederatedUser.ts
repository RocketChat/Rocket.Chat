import { FederatedUser } from '../../../../../app/federation-v2/server/domain/FederatedUser';

export interface IFederatedUserCreationParams {
	name: string;
	username: string;
	existsOnlyOnProxyServer: boolean;
}

export class FederatedUserEE extends FederatedUser {
	public static build(): FederatedUserEE {
		return new FederatedUserEE();
	}
}
