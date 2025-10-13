/**
 * Federation environment configuration interface
 */
export interface FederationConfig {
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
 * Validates that a required environment variable exists and is not empty
 */
function validateEnvVar(name: string, value: string | undefined, defaultValue?: string): string {
	const finalValue = value || defaultValue;
	if (!finalValue || finalValue.trim() === '') {
		throw new Error(`Required environment variable ${name} is not set or is empty`);
	}
	return finalValue;
}

/**
 * Gets and validates all federation environment variables
 */
function getFederationConfig(): FederationConfig {
	return {
		rc1: {
			apiUrl: validateEnvVar('FEDERATION_RC1_API_URL', process.env.FEDERATION_RC1_API_URL, 'https://rc1'),
			adminUser: validateEnvVar('FEDERATION_RC1_ADMIN_USER', process.env.FEDERATION_RC1_ADMIN_USER, 'admin'),
			adminPassword: validateEnvVar('FEDERATION_RC1_ADMIN_PASSWORD', process.env.FEDERATION_RC1_ADMIN_PASSWORD, 'admin'),
			adminMatrixUserId: validateEnvVar('FEDERATION_RC1_USER_ID', process.env.FEDERATION_RC1_USER_ID, '@admin:rc1'),
			additionalUser1: {
				username: validateEnvVar('FEDERATION_RC1_ADDITIONAL_USER', process.env.FEDERATION_RC1_ADDITIONAL_USER1, 'user2'),
				password: validateEnvVar('FEDERATION_RC1_ADDITIONAL_PASSWORD', process.env.FEDERATION_RC1_ADDITIONAL_USER1_PASSWORD, 'user2pass'),
				matrixUserId: validateEnvVar('FEDERATION_RC1_ADDITIONAL_USER_ID', process.env.FEDERATION_RC1_ADDITIONAL_USER1_MATRIX_ID, '@user2:rc1'),
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
				username: validateEnvVar('FEDERATION_SYNAPSE_ADDITIONAL_USER', process.env.FEDERATION_SYNAPSE_ADDITIONAL_USER1, 'user2'),
				password: validateEnvVar('FEDERATION_SYNAPSE_ADDITIONAL_PASSWORD', process.env.FEDERATION_SYNAPSE_ADDITIONAL_USER1_PASSWORD, 'user2pass'),
				matrixUserId: validateEnvVar('FEDERATION_SYNAPSE_ADDITIONAL_USER_ID', process.env.FEDERATION_SYNAPSE_ADDITIONAL_USER1_MATRIX_ID, '@user2:hs1'),
			},
		},
	};
}

// Validate and export federation configuration
let federationConfig: FederationConfig;
try {
	federationConfig = getFederationConfig();
} catch (error) {
	console.error('Federation environment configuration error:', error);
	process.exit(1);
}

export { federationConfig };
