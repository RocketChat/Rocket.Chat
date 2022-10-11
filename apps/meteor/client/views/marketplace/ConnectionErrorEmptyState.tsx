import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

const ConnectionErrorEmptyState = ({ onButtonClick }: { onButtonClick: () => void }): ReactElement => {
	const t = useTranslation();

	return (
		<Box mbs='x20'>
			<States>
				<StatesIcon variation='danger' name='circle-exclamation' />
				<StatesTitle>{t('Connection_error')}</StatesTitle>
				<StatesSubtitle>{t('Marketplace_error')}</StatesSubtitle>
				<StatesActions>
					<StatesAction onClick={onButtonClick}>
						<Icon mie='x4' size='x20' name='reload' />
						{t('Reload_page')}
					</StatesAction>
				</StatesActions>
			</States>
		</Box>
	);
};

export default ConnectionErrorEmptyState;
