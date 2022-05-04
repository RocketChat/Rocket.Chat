import type { ILivechatDepartment, IOmnichannelCannedResponse } from '@rocket.chat/core-typings';

import { useTranslation } from '../../../../client/contexts/TranslationContext';

export const useScopeDict = (scope: IOmnichannelCannedResponse['scope'], departmentName: ILivechatDepartment['name']): string => {
	const t = useTranslation();

	const dict: Record<string, string> = {
		global: t('Public'),
		user: t('Private'),
	};

	return dict[scope] || departmentName;
};
