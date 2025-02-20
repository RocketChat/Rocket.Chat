import { Box, Icon } from '@rocket.chat/fuselage';
import { MessageFooterCallout } from '@rocket.chat/ui-composer';
import type { ReactElement } from 'react';
import { Trans } from 'react-i18next';

const ComposerAirGappedRestricted = (): ReactElement => {
	return (
		<MessageFooterCallout color='default'>
			<Icon name='warning' size={20} mie={4} />
			<span>
				<Trans i18nKey='Composer_readonly_airgapped'>
					<Box is='span' fontWeight={600}>
						Workspace in read-only mode.
					</Box>
					Admins can restore full functionality by connecting it to internet or upgrading to a premium plan.
				</Trans>
			</span>
		</MessageFooterCallout>
	);
};

export default ComposerAirGappedRestricted;
