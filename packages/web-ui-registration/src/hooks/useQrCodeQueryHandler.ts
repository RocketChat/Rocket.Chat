import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

export const useQrCodeQueryHandler = () => {
    const getQrCode = useEndpoint('GET', '/v1/oauth-apps.qrcode');

    return useQuery({
        queryKey: ['oauth-app.qrcode'] as const,
        queryFn: async () => {
            console.log(new Date(), 'API call made');
            const data = await getQrCode();
            return data as string;
        }
    } satisfies UseQueryOptions<string, Error, string, readonly ['oauth-app.qrcode']>);
};