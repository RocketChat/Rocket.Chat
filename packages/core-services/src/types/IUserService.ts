export interface IUserService {
	ensureLoginTokensLimit(uid: string): Promise<void>;
}
