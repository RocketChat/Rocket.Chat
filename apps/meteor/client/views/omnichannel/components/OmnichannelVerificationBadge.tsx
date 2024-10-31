import { Box, Icon, Tag } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

type OmnichannelVerificationBadgeProps = {
	verified?: boolean;
	onClick?: () => void;
};

const OmnichannelVerificationBadge = ({ verified, onClick }: OmnichannelVerificationBadgeProps) => {
	const { t } = useTranslation();
	const hasLicense = useHasLicenseModule('contact-id-verification') as boolean;

	if (hasLicense && verified) {
		return <Icon title={t('Verified')} mis={4} size='x16' name='success-circle' color='stroke-highlight' />;
	}

	return (
		<Box mis={4} withTruncatedText>
			<Tag onClick={onClick} icon={<Icon size='x12' mie={4} name='question-mark' />}>
				{t('Unverified')}
			</Tag>
		</Box>
	);
};

export default OmnichannelVerificationBadge;
