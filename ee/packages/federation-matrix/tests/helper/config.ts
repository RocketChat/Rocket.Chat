/**
 * Configuration interface for federation test environment.
 *
 * Defines the structure for all federation-related configuration including
 * Rocket.Chat instances, Matrix homeservers, and user credentials needed
 * for end-to-end federation testing.
 */
export interface IFederationConfig {
	rc1: {
		apiUrl: string;
		adminUser: string;
		adminPassword: string;
		adminMatrixUserId: string;
		additionalUser1: {
			username: string;
			password: string;
			matrixUserId: string;
		};
	};
	hs1: {
		url: string;
		adminMatrixUserId: string;
		password: string;
		homeserver: string;
		adminUser: string;
		adminPassword: string;
		additionalUser1: {
			username: string;
			password: string;
			matrixUserId: string;
		};
	};
}

/**
 * Validates that a required environment variable exists and is not empty.
 *
 * Ensures that all federation test configuration is properly set by validating
 * environment variables and providing sensible defaults where appropriate.
 * Throws an error if a required variable is missing or empty.
 *
 * @param name - The name of the environment variable for error messages
 * @param value - The environment variable value (may be undefined)
 * @param defaultValue - Optional default value to use if variable is not set
 * @returns The validated value (either the env var or default)
 * @throws Error if the variable is required but missing or empty
 */
function validateEnvVar(name: string, value: string | undefined, defaultValue?: string): string {
	const finalValue = value || defaultValue;
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
	return {
		rc1: {
			apiUrl: validateEnvVar('FEDERATION_RC1_API_URL', process.env.FEDERATION_RC1_API_URL, 'https://rc1'),
			adminUser: validateEnvVar('FEDERATION_RC1_ADMIN_USER', process.env.FEDERATION_RC1_ADMIN_USER, 'admin'),
			adminPassword: validateEnvVar('FEDERATION_RC1_ADMIN_PASSWORD', process.env.FEDERATION_RC1_ADMIN_PASSWORD, 'admin'),
			adminMatrixUserId: validateEnvVar('FEDERATION_RC1_USER_ID', process.env.FEDERATION_RC1_USER_ID, '@admin:rc1'),
			additionalUser1: {
				username: validateEnvVar('FEDERATION_RC1_ADDITIONAL_USER1', process.env.FEDERATION_RC1_ADDITIONAL_USER1, 'user2'),
				password: validateEnvVar(
					'FEDERATION_RC1_ADDITIONAL_USER1_PASSWORD',
					process.env.FEDERATION_RC1_ADDITIONAL_USER1_PASSWORD,
					'user2pass',
				),
				matrixUserId: validateEnvVar(
					'FEDERATION_RC1_ADDITIONAL_USER1_MATRIX_ID',
					process.env.FEDERATION_RC1_ADDITIONAL_USER1_MATRIX_ID,
					'@user2:rc1',
				),
			},
		},
		hs1: {
			url: validateEnvVar('FEDERATION_SYNAPSE_URL', process.env.FEDERATION_SYNAPSE_URL, 'https://hs1'),
			adminMatrixUserId: validateEnvVar('FEDERATION_SYNAPSE_USER', process.env.FEDERATION_SYNAPSE_USER, '@admin:hs1'),
			password: validateEnvVar('FEDERATION_SYNAPSE_PASSWORD', process.env.FEDERATION_SYNAPSE_PASSWORD, 'admin'),
			homeserver: validateEnvVar('FEDERATION_SYNAPSE_HOMESERVER', process.env.FEDERATION_SYNAPSE_HOMESERVER, 'hs1'),
			adminUser: validateEnvVar('FEDERATION_SYNAPSE_ADMIN_USER', process.env.FEDERATION_SYNAPSE_ADMIN_USER, 'admin'),
			adminPassword: validateEnvVar('FEDERATION_SYNAPSE_ADMIN_PASSWORD', process.env.FEDERATION_SYNAPSE_ADMIN_PASSWORD, 'admin'),
			additionalUser1: {
				username: validateEnvVar('FEDERATION_SYNAPSE_ADDITIONAL_USER1', process.env.FEDERATION_SYNAPSE_ADDITIONAL_USER1, 'alice'),
				password: validateEnvVar(
					'FEDERATION_SYNAPSE_ADDITIONAL_USER1_PASSWORD',
					process.env.FEDERATION_SYNAPSE_ADDITIONAL_USER1_PASSWORD,
					'alice',
				),
				matrixUserId: validateEnvVar(
					'FEDERATION_SYNAPSE_ADDITIONAL_USER1_MATRIX_ID',
					process.env.FEDERATION_SYNAPSE_ADDITIONAL_USER1_MATRIX_ID,
					'@alice:hs1',
				),
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
