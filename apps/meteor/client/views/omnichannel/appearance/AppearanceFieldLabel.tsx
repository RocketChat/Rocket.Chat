import { FieldLabel as BaseFieldLabel, Box, Tag } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React from 'react';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

type FieldLabelProps = ComponentProps<typeof BaseFieldLabel> & {
	premium?: boolean;
	children: string;
};

const FieldLabel = ({ children: label, premium = false }: FieldLabelProps) => {
	const t = useTranslation();
	const hasLicense = useHasLicenseModule('livechat-enterprise');
	const shouldDisableEnterprise = premium && !hasLicense;

	if (!shouldDisableEnterprise) {
		return <BaseFieldLabel>{label}</BaseFieldLabel>;
	}

	return (
		<BaseFieldLabel>
			<Box is='span' mie={4}>
				{label}
			</Box>
			<Tag variant='primary'>{t('Premium')}</Tag>
		</BaseFieldLabel>
	);
};

export default FieldLabel;
