import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

export const useQrCodeQueryHandler = () => {
	const getQrCode = useEndpoint('POST', '/v1/qrcode.generate');

	const generateQrCode = useCallback(
		async (sessionId: string) => {
			try {
				const data = await getQrCode({
					sessionId,
				});
				if (!data.success) throw new Error('Failed to generate QR code');
				return data.qrCodeUrl as string;
			} catch (error) {
				throw error;
			}
		},
		[getQrCode],
	);

	return generateQrCode;
};
