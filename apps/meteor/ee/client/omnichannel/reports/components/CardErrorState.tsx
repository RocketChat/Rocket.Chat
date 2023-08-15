import { States, StatesAction, StatesActions, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

type CardErrorStateProps = {
	children: ReactNode;
	isError?: boolean;
	onRetry?: () => void;
};

export const CardErrorState = ({ children, isError, onRetry }: CardErrorStateProps): ReactElement => {
	const t = useTranslation();

	return (
		<>
			{isError ? (
				<States>
					<StatesIcon name='circle-exclamation' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
					<StatesActions data-qa='CardErrorState'>
						<StatesAction onClick={onRetry}>{t('Retry')}</StatesAction>
					</StatesActions>
				</States>
			) : (
				children
			)}
		</>
	);
};
