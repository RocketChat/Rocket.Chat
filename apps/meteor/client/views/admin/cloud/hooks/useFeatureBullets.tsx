import { useTranslation } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

type featureBulletsType = {
  key: number;
	title: string;
	description: string;
};

const useFeatureBullets = () => {
  const t = useTranslation();

	const featureBullets: featureBulletsType[] = useMemo(
		() => [
      {
        key: 1,
        title: t('RegisterWorkspace_Features_MobileNotifications_Title'),
        description: t('RegisterWorkspace_Features_MobileNotifications_Description'),
      },
      {
        key: 2,
        title: t('RegisterWorkspace_Features_Marketplace_Title'),
        description: t('RegisterWorkspace_Features_Marketplace_Description'),
      },
      {
        key: 3,
        title: t('RegisterWorkspace_Features_Omnichannel_Title'),
        description: t('RegisterWorkspace_Features_Omnichannel_Description'),
      },
      {
        key: 4,
        title: t('RegisterWorkspace_Features_ThirdPartyLogin_Title'),
        description: t('RegisterWorkspace_Features_ThirdPartyLogin_Description'),
      },
	], [t]);
  
  return featureBullets;
}

export default useFeatureBullets