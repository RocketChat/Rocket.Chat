import { useEndpoint } from '@rocket.chat/ui-contexts';

export const useQrCodeQueryHandler = async (sessionId: string) => {
    const getQrCode = useEndpoint('POST', '/v1/qrcode.generate');

    const data = await getQrCode({
        sessionId
    });
    return data as string;
};