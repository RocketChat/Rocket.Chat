import { Box, SidebarFooterContent as FooterContent } from '@rocket.chat/fuselage';
import { useLicense, useLicenseName } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { links } from '../../lib/links';

export const SidebarFooterWatermark = () => {
	const { t } = useTranslation();

	const response = useLicense();

	const licenseName = useLicenseName();

	if (response.isLoading || response.isError) {
		return null;
	}

	if (licenseName.isError || licenseName.isLoading) {
		return null;
	}

	const license = response.data;

	if (license?.activeModules.includes('hide-watermark') && !license.trial) {
		return null;
	}

	return (
		<FooterContent paddingBlockEnd={8}>
			<Box is='a' href={links.rocketChat} target='_blank' rel='noopener noreferrer'>
				<Box color='hint' paddingBlockEnd={4}>
					{t('Powered_by_RocketChat')}
				</Box>
				<Box color='pure-white' paddingBlockEnd={4}>
					{licenseName.data}
				</Box>
			</Box>
		</FooterContent>
	);
};
