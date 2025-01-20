import { FieldLabel, Box, Tag } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

type AppearanceFieldLabelProps = ComponentProps<typeof FieldLabel> & {
	premium?: boolean;
	children: string;
};

const AppearanceFieldLabel = ({ children, premium = false }: AppearanceFieldLabelProps) => {
	const { t } = useTranslation();
	const hasLicense = useHasLicenseModule('livechat-enterprise');
	const shouldDisableEnterprise = premium && !hasLicense;

	if (!shouldDisableEnterprise) {
		return <FieldLabel>{children}</FieldLabel>;
	}

	return (
		<FieldLabel>
			<Box is='span' mie={4}>
				{children}
			</Box>
			<Tag variant='featured'>{t('Premium')}</Tag>
		</FieldLabel>
	);
};

export default AppearanceFieldLabel;
