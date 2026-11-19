import { States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction, Stack } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

const AppsPageContentError = ({ onButtonClick }: { onButtonClick: () => void }) => {
	const { t } = useTranslation();

	return (
		<Stack grow justify='center'>
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
		</Stack>
	);
};

export default AppsPageContentError;
