import { useTranslation } from '../../../../client/contexts/TranslationContext';
import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import type { IOmnichannelCannedResponse } from '@rocket.chat/core-typings';

export const useScopeDict = (scope: IOmnichannelCannedResponse['scope'], departmentName: ILivechatDepartment['name']): string => {
	const t = useTranslation();

	const dict: Record<string, string> = {
		global: t('Public'),
		user: t('Private'),
	};

	return dict[scope] || departmentName;
};
