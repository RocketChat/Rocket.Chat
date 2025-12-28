import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

const AppsPageContentError = ({ onButtonClick }: { onButtonClick: () => void }): ReactElement => {
	const { t } = useTranslation();

	return (
		<Box mbs={20}>
			<States>
				<StatesIcon variation='danger' name='circle-exclamation' />
				<StatesTitle>{t('Connection_error')}</StatesTitle>
				<StatesSubtitle>{t('Marketplace_error')}</StatesSubtitle>
				<StatesActions>
					<StatesAction icon='reload' onClick={onButtonClick}>
						{t('Reload_page')}
					</StatesAction>
				</StatesActions>
			</States>
		</Box>
	);
};

export default AppsPageContentError;
