import { States, StatesAction, StatesActions, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

type CardErrorBoundaryProps = {
	children?: ReactNode;
};

export const CardErrorBoundary = ({ children }: CardErrorBoundaryProps): ReactElement => {
	const t = useTranslation();

	const errorHandler = (error: Error, info: { componentStack: string }): void => {
		console.error('Uncaught Error:', error, info);
	};

	return (
		<QueryErrorResetBoundary>
			{({ reset }): ReactElement => (
				<ErrorBoundary
					children={children}
					onError={errorHandler}
					onReset={reset}
					fallbackRender={({ resetErrorBoundary }): ReactElement => (
						<States>
							<StatesIcon name='circle-exclamation' />
							<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
							<StatesActions data-qa='CardErrorBoundary'>
								<StatesAction onClick={(): void => resetErrorBoundary()}>{t('Retry')}</StatesAction>
							</StatesActions>
						</States>
					)}
				/>
			)}
		</QueryErrorResetBoundary>
	);
};
