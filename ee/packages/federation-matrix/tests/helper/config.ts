/**
 * Configuration interface for federation test environment.
 *
 * Defines the structure for all federation-related configuration including
 * Rocket.Chat instances, Matrix homeservers, and user credentials needed
 * for end-to-end federation testing.
 */

type FederationUserConfig = {
	username: string;
	password: string;
	matrixUserId: string;
};

type FederationServerConfig = {
	url: string;
	domain: string;
	adminUser: string;
	adminPassword: string;
	adminMatrixUserId: string;
	additionalUser1: FederationUserConfig;
	/**
	 * Reserved for tests that need a user the other side has never seen. Must not be used
	 * anywhere else: the moment another spec touches it, the local user document exists and
	 * first-contact behaviour can no longer be observed.
	 */
	firstContactUser: FederationUserConfig;
};
export interface IFederationConfig {
	rc1: FederationServerConfig;
	hs1: FederationServerConfig;
}

/**
 * Validates that a required environment variable exists and is not empty.
 *
 * Ensures that all federation test configuration is properly set by validating
 * environment variables and providing sensible defaults where appropriate.
 * Throws an error if a required variable is missing or empty.
 *
 * @param name - The name of the environment variable for error messages
 * @param defaultValue - Optional default value to use if variable is not set
 * @returns The validated value (either the env var or default)
 * @throws Error if the variable is required but missing or empty
 */
function validateEnvVar(name: string, defaultValue?: string): string {
	const finalValue = process.env[name] || defaultValue;
	if (!finalValue || finalValue.trim() === '') {
		throw new Error(`Required environment variable ${name} is not set or is empty`);
	}
	return finalValue;
}

/**
 * Builds and validates the complete federation test configuration.
 *
 * Reads all federation-related environment variables, validates them,
 * and constructs a complete configuration object. Uses sensible defaults
 * for development and testing scenarios while ensuring all required
 * values are present.
 *
 * @returns Complete federation configuration object
 * @throws Error if any required configuration is missing or invalid
 */
function getFederationConfig(): IFederationConfig {
	const rcDomain = validateEnvVar('FEDERATION_RC1_DOMAIN', 'rc1');
	const rcAdminUser = validateEnvVar('FEDERATION_RC1_ADMIN_USER', 'admin');
	const rcAdminPassword = validateEnvVar('FEDERATION_RC1_ADMIN_PASSWORD', 'admin');
	const rcAdditionalUser1 = validateEnvVar('FEDERATION_RC1_ADDITIONAL_USER1', 'user2');
	const rcAdditionalUser1Password = validateEnvVar('FEDERATION_RC1_ADDITIONAL_USER1_PASSWORD', 'user2pass');
	const rcFirstContactUser = validateEnvVar('FEDERATION_RC1_FIRST_CONTACT_USER', 'user3');
	const rcFirstContactUserPassword = validateEnvVar('FEDERATION_RC1_FIRST_CONTACT_USER_PASSWORD', 'user3pass');

	const hs1Domain = validateEnvVar('FEDERATION_SYNAPSE_DOMAIN', 'hs1');
	const hs1AdminUser = validateEnvVar('FEDERATION_SYNAPSE_ADMIN_USER', 'admin');
	const hs1AdminPassword = validateEnvVar('FEDERATION_SYNAPSE_ADMIN_PASSWORD', 'admin');
	const hs1AdditionalUser1 = validateEnvVar('FEDERATION_SYNAPSE_ADDITIONAL_USER1', 'alice');
	const hs1AdditionalUser1Password = validateEnvVar('FEDERATION_SYNAPSE_ADDITIONAL_USER1_PASSWORD', 'alice');
	// `cleiton` is registered by docker-compose.test.yml and deliberately used by no other spec
	const hs1FirstContactUser = validateEnvVar('FEDERATION_SYNAPSE_FIRST_CONTACT_USER', 'cleiton');
	const hs1FirstContactUserPassword = validateEnvVar('FEDERATION_SYNAPSE_FIRST_CONTACT_USER_PASSWORD', 'cleiton');

	return {
		rc1: {
			url: `https://${rcDomain}`,
			domain: rcDomain,
			adminUser: rcAdminUser,
			adminPassword: rcAdminPassword,
			adminMatrixUserId: `@${rcAdminUser}:${rcDomain}`,
			additionalUser1: {
				username: rcAdditionalUser1,
				password: rcAdditionalUser1Password,
				matrixUserId: `@${rcAdditionalUser1}:${rcDomain}`,
			},
			firstContactUser: {
				username: rcFirstContactUser,
				password: rcFirstContactUserPassword,
				matrixUserId: `@${rcFirstContactUser}:${rcDomain}`,
			},
		},
		hs1: {
			url: `https://${hs1Domain}`,
			domain: hs1Domain,
			adminUser: hs1AdminUser,
			adminMatrixUserId: `@${hs1AdminUser}:${hs1Domain}`,
			adminPassword: hs1AdminPassword,
			additionalUser1: {
				username: hs1AdditionalUser1,
				password: hs1AdditionalUser1Password,
				matrixUserId: `@${hs1AdditionalUser1}:${hs1Domain}`,
			},
			firstContactUser: {
				username: hs1FirstContactUser,
				password: hs1FirstContactUserPassword,
				matrixUserId: `@${hs1FirstContactUser}:${hs1Domain}`,
			},
		},
	};
}

/**
 * Validated federation configuration for test execution.
 *
 * This configuration is loaded at module initialization time and
 * will cause the process to exit if any required environment
 * variables are missing or invalid.
 */
let federationConfig: IFederationConfig;
try {
	federationConfig = getFederationConfig();
} catch (error) {
	console.error('Federation environment configuration error:', error);
	process.exit(1);
}

export { federationConfig };
