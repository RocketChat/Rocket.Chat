import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type featureBulletsType = {
	key: number;
	title: string;
	description: string;
	disconnect: string;
};

const useFeatureBullets = () => {
	const { t } = useTranslation();

	const featureBullets: featureBulletsType[] = useMemo(
		() => [
			{
				key: 1,
				title: t('RegisterWorkspace_Features_MobileNotifications_Title'),
				description: t('RegisterWorkspace_Features_MobileNotifications_Description'),
				disconnect: t('RegisterWorkspace_Features_MobileNotifications_Disconnect'),
			},
			{
				key: 2,
				title: t('RegisterWorkspace_Features_Marketplace_Title'),
				description: t('RegisterWorkspace_Features_Marketplace_Description'),
				disconnect: t('RegisterWorkspace_Features_Marketplace_Disconnect'),
			},
			{
				key: 3,
				title: t('RegisterWorkspace_Features_Omnichannel_Title'),
				description: t('RegisterWorkspace_Features_Omnichannel_Description'),
				disconnect: t('RegisterWorkspace_Features_Omnichannel_Disconnect'),
			},
		],
		[t],
	);

	return featureBullets;
};

export default useFeatureBullets;
