import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { ILivechatDepartment } from '../../../../definition/ILivechatDepartment';
import { IOmnichannelCannedResponse } from '../../../../definition/IOmnichannelCannedResponse';

export const useScopeDict = (
	scope: IOmnichannelCannedResponse['scope'],
	departmentName: ILivechatDepartment['name'],
): string => {
	const t = useTranslation();

	const dict: Record<string, string> = {
		global: t('Public'),
		user: t('Private'),
	};

	return dict[scope] || departmentName;
};
