import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

export const useQrCodeQueryHandler = () => {
    const getQrCode = useEndpoint('POST', '/v1/oauth-apps.qrcode-generate');

    const generateQrCode = useCallback(async (sessionId: string) => {
        try {
            const data = await getQrCode({
                sessionId
            });
            return data as string;
        } catch (error) {
            throw error;
        }
    }, [getQrCode]);

    return generateQrCode;
};