export interface IModerationService {
	// adds the novice and explorer roles
	addTrustRoles(): Promise<void>;
	// removes the novice and explorer roles
	removeTrustRoles(): Promise<void>;
}
