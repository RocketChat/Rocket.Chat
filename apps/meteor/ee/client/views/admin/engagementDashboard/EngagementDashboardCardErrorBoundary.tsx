import { States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import React, { ReactElement, ReactNode, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

export type EngagementDashboardCardErrorBoundaryProps = {
	children?: ReactNode;
};

const EngagementDashboardCardErrorBoundary = ({ children }: EngagementDashboardCardErrorBoundaryProps): ReactElement => {
	const t = useTranslation();

	const [error, setError] = useState<Error>();
	const isError = (error: unknown): error is Error => error instanceof Error;

	const errorHandler = (error: Error, info: { componentStack: string }): void => {
		setError(error);
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
							<StatesTitle>{t('Something_Went_Wrong')}</StatesTitle>
							<StatesSubtitle>{isError(error) && error?.message}</StatesSubtitle>
							<StatesActions data-qa='EngagementDashboardCardErrorBoundary'>
								<StatesAction onClick={(): void => resetErrorBoundary()}>{t('Retry')}</StatesAction>
							</StatesActions>
						</States>
					)}
				/>
			)}
		</QueryErrorResetBoundary>
	);
};

export default EngagementDashboardCardErrorBoundary;
