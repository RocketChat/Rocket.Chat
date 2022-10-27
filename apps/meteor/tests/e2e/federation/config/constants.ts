export const RC_SERVER_1 = {
	url: process.env.RC_SERVER_1 ?? 'http://localhost:3000',
	username: process.env.RC_SERVER_1_ADMIN_USER ?? '',
	password: process.env.RC_SERVER_1_ADMIN_PASSWORD ?? '',
	matrixServerName: process.env.RC_SERVER_1_MATRIX_SERVER_NAME ?? '',
};

export const RC_SERVER_2 = {
	url: process.env.RC_SERVER_2 ?? 'http://localhost:3000',
	username: process.env.RC_SERVER_2_ADMIN_USER ?? '',
	password: process.env.RC_SERVER_2_ADMIN_PASSWORD ?? '',
	matrixServerName: process.env.RC_SERVER_2_MATRIX_SERVER_NAME ?? '',
};
