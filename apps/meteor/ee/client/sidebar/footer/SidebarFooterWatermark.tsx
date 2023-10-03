import { Box } from '@rocket.chat/fuselage';
import type { ILicenseV3 } from '@rocket.chat/license';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useLicense } from '../../../../client/hooks/useLicense';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

export const SidebarFooterWatermark = (): ReactElement | null => {
	const t = useTranslation();

	const { data } = useLicense();
	const [license] = (data?.licenses ?? []) as (ILicenseV3 & { modules: string[] })[]; // TODO: temporary, remover after #30473 is merged
	const [planTag] = license.information?.tags ?? [];

	const isWatermarkVisible = useHasLicenseModule('watermark') === true;

	if (!isWatermarkVisible) {
		return null;
	}

	return (
		<Box pi={16} pbe={8}>
			<Box is='a' href='https://rocket.chat/' target='_blank' rel='noopener noreferrer'>
				<Box fontScale='micro' color='hint' pbe={4}>
					{t('Powered_by_RocketChat')}
				</Box>
				<Box fontScale='micro' color='pure-white' pbe={4}>
					{planTag.name}
				</Box>
			</Box>
		</Box>
	);
};
