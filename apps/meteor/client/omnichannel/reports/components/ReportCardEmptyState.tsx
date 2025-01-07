import { States, StatesIcon, StatesTitle, StatesSubtitle } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import { useTranslation } from 'react-i18next';

type CardEmpryStateProps = {
	icon?: Keys;
	subtitle?: string;
};

export const ReportCardEmptyState = ({ icon, subtitle }: CardEmpryStateProps) => {
	const { t } = useTranslation();

	return (
		<States width='100%' height='100%'>
			<StatesIcon name={icon || 'dashboard'} />
			<StatesTitle>{t('No_data_available_for_the_selected_period')}</StatesTitle>
			{subtitle && <StatesSubtitle>{subtitle}</StatesSubtitle>}
		</States>
	);
};
