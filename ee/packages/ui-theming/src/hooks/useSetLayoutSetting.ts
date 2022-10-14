import { useEndpoint } from '@rocket.chat/ui-contexts';

export const useSetLayoutSetting = () => {
	return useEndpoint('POST', '/v1/settings/Layout_Fuselage_Palette') as unknown as ({ value }: { value: string }) => void;
};
