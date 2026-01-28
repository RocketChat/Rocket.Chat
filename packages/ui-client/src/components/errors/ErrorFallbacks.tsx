import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

/** Tier 1: Global Fallback - Full application crash */
export const GlobalErrorFallback = () => {
	const { t } = useTranslation();
	return (
		<Box display='flex' justifyContent='center' alignItems='center' height='vh100' bg='tint'>
			<States>
				<StatesIcon name='warning' variation='danger' />
				<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
				<StatesSubtitle>{t('A_critical_error_occurred_Please_reload_the_page')}</StatesSubtitle>
				<StatesActions>
					<StatesAction onClick={() => window.location.reload()}>{t('Reload_Page')}</StatesAction>
				</StatesActions>
			</States>
		</Box>
	);
};

/** Tier 2: Feature Fallback - Major sections (Admin, Chat, etc.) */
export const FeatureErrorFallback = ({ resetErrorBoundary }: { resetErrorBoundary: () => void }) => {
	const { t } = useTranslation();
	return (
		<Box display='flex' justifyContent='center' p='x24' height='full' width='full' bg='tint'>
			<States>
				<StatesIcon name='circle-exclamation' variation='danger' />
				<StatesTitle>{t('Feature_failed_to_load')}</StatesTitle>
				<StatesSubtitle>{t('We_have_logged_the_error_Try_refreshing_this_section')}</StatesSubtitle>
				<StatesActions>
					<StatesAction onClick={resetErrorBoundary}>{t('Retry')}</StatesAction>
				</StatesActions>
			</States>
		</Box>
	);
};

/** Tier 3: Component Fallback - Small UI blocks/widgets */
export const ComponentErrorFallback = () => {
	const { t } = useTranslation();
	return (
		<Box 
			display='inline-flex' 
			alignItems='center' 
			justifyContent='center' 
			color='danger' 
			title={t('Component_error')}
			borderWidth='default'
			borderColor='danger'
			borderRadius='x4'
			p='x2'
			m='x2'
		>
			⚠️
		</Box>
	);
};
