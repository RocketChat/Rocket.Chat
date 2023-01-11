import { useEndpoint } from '@rocket.chat/ui-contexts';

export const useSetLayoutSetting = (): (({ value }: { value: string }) => void) => {
	return useEndpoint('POST', '/v1/settings/:_id', { _id: 'Layout_Fuselage_Palette' });
};
