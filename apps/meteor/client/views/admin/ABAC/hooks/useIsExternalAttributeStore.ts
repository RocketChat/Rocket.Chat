import { useSetting } from '@rocket.chat/ui-contexts';

export const useIsExternalAttributeStore = (): boolean => {
	const pdpType = useSetting('ABAC_PDP_Type', 'local');
	const attributeStore = useSetting('ABAC_Attribute_Store', 'local');

	return pdpType !== 'local' && attributeStore !== 'local';
};
