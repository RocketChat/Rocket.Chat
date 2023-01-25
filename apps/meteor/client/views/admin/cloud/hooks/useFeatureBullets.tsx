import { useTranslation } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

type featureBulletsType = {
  key: number;
	title: string;
	description: string;
  deregister: string;
};

const useFeatureBullets = () => {
  const t = useTranslation();

	const featureBullets: featureBulletsType[] = useMemo(
		() => [
      {
        key: 1,
        title: t('RegisterWorkspace_Features_MobileNotifications_Title'),
        description: t('RegisterWorkspace_Features_MobileNotifications_Description'),
        deregister: t('RegisterWorkspace_Features_MobileNotifications_Deregister')
      },
      {
        key: 2,
        title: t('RegisterWorkspace_Features_Marketplace_Title'),
        description: t('RegisterWorkspace_Features_Marketplace_Description'),
        deregister: t('RegisterWorkspace_Features_Marketplace_Deregister'),
      },
      {
        key: 3,
        title: t('RegisterWorkspace_Features_Omnichannel_Title'),
        description: t('RegisterWorkspace_Features_Omnichannel_Description'),
        deregister: t('RegisterWorkspace_Features_Omnichannel_Deregister'),
      },
      {
        key: 4,
        title: t('RegisterWorkspace_Features_ThirdPartyLogin_Title'),
        description: t('RegisterWorkspace_Features_ThirdPartyLogin_Description'),
        deregister: t('RegisterWorkspace_Features_ThirdPartyLogin_Deregister'),
      },
	], [t]);
  
  return featureBullets;
}

export default useFeatureBullets