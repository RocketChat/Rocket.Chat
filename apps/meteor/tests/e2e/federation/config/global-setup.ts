export default async function (): Promise<void> {
	const requiredEnvVars = [
		'RC_SERVER_1',
		'RC_SERVER_2',
		'RC_SERVER_1_ADMIN_USER',
		'RC_SERVER_1_ADMIN_PASSWORD',
		'RC_SERVER_1_MATRIX_SERVER_NAME',
		'RC_SERVER_2_ADMIN_USER',
		'RC_SERVER_2_ADMIN_PASSWORD',
		'RC_SERVER_2_MATRIX_SERVER_NAME',
		'RC_EXTRA_SERVER',
		'RC_EXTRA_SERVER_ADMIN_USER',
		'RC_EXTRA_SERVER_ADMIN_PASSWORD',
		'RC_EXTRA_SERVER_MATRIX_SERVER_NAME',
	];

	if (requiredEnvVars.some((envVar) => !process.env[envVar])) {
		throw new Error(`Missing required environment variables: ${requiredEnvVars.filter((envVar) => !process.env[envVar]).join(', ')}`);
	}
}
