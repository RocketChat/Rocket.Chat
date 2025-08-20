import { Settings } from '@rocket.chat/core-services';

export const getMatrixLocalDomain = async () => {
	const port = await Settings.get<number>('Federation_Service_Matrix_Port');
	const domain = await Settings.get<string>('Site_Url');
	if (!port || !domain) {
		throw new Error('Matrix domain or port not found');
	}

	const matrixDomain = port === 443 || port === 80 ? domain : `${domain}:${port}`;

	return String(matrixDomain);
};
