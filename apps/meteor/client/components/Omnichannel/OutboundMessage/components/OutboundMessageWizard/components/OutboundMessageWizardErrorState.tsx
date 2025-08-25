import { States, StatesIcon, StatesTitle, StatesActions, StatesAction, StatesDescription } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

type Props = {
	title?: string;
	description?: string;
	onRetry?(): void;
};

const OutboundMessageWizardErrorState = ({ title, description, onRetry }: Props) => {
	const { t } = useTranslation();
	return (
		<States width='100%' height='100%'>
			<StatesIcon name='circle-exclamation' />
			<StatesTitle>{title ?? t('Something_went_wrong')}</StatesTitle>
			{description ? <StatesDescription>{description}</StatesDescription> : null}
			{onRetry ? (
				<StatesActions>
					<StatesAction onClick={onRetry}>{t('Retry')}</StatesAction>
				</StatesActions>
			) : null}
		</States>
	);
};

export default OutboundMessageWizardErrorState;
