import { FieldLabel, Box, Tag } from '@rocket.chat/fuselage';
import { useHasLicenseModule } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

export type AppearanceFieldLabelProps = ComponentProps<typeof FieldLabel> & {
	premium?: boolean;
	children: string;
};

const AppearanceFieldLabel = ({ children, premium = false, ...props }: AppearanceFieldLabelProps) => {
	const { t } = useTranslation();
	const { data: hasLicense = false } = useHasLicenseModule('livechat-enterprise');
	const shouldDisableEnterprise = premium && !hasLicense;

	if (!shouldDisableEnterprise) {
		return <FieldLabel {...props}>{children}</FieldLabel>;
	}

	return (
		<FieldLabel {...props}>
			<Box is='span' marginInlineEnd={4}>
				{children}
			</Box>
			<Tag variant='featured'>{t('Premium')}</Tag>
		</FieldLabel>
	);
};

export default AppearanceFieldLabel;
