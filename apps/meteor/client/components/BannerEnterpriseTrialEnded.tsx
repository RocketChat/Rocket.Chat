import { Banner, Icon } from '@rocket.chat/fuselage';
import { useRole, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

function BannerEnterpriseTrialEnded() {
	const t = useTranslation();
	const authorized = useRole('admin');

	const bannerProps = authorized
		? {
				link: 'https://rocket.chat/',
				linkText: t('Upgrade your plan'),
		  }
		: {};

	return (
		<>
			<Banner
				// TODO: change button action and fix translation
				closeable
				icon={<Icon name='store' size={24} color='font-on-warning' />}
				title={t('Apps disabled when Enterprise trial ended')}
				onClose={() => {
					console.log('closed');
				}}
				{...bannerProps}
			>
				{authorized
					? t(
							'Workspaces on Community Edition can have up to 5 marketplace apps and 3 private apps enabled. Reenable the apps you require.',
					  )
					: t(
							'Workspaces on Community Edition can have up to 5 marketplace apps and 3 private apps enabled. Ask your workspace admin to reenable apps.',
					  )}
				{}
			</Banner>
		</>
	);
}

export default BannerEnterpriseTrialEnded;
