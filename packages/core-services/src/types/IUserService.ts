export interface IUserService {
	ensureLoginTokensLimit(uid: string): Promise<void>;

	disable2FA(uid: string, code: string): Promise<boolean>;
	enable2FA(uid: string): Promise<void>;
	validateTempToken(uid: string, token: string): Promise<boolean | null>;
	checkCodesRemaining(uid: string): Promise<{ remaining: number }>;
	regenerate2FACodes(uid: string): Promise<{ codes: string[] }>;
}