import { States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

type EngagementDashboardCardErrorBoundaryProps = {
	children?: ReactNode;
};

const EngagementDashboardCardErrorBoundary = ({ children }: EngagementDashboardCardErrorBoundaryProps) => {
	const { t } = useTranslation();

	const [error, setError] = useState<unknown>(null);
	const isError = (error: unknown): error is Error => error instanceof Error;

	const errorHandler = (error: unknown, info: { componentStack?: string | null }): void => {
		setError(error);
		console.error('Uncaught Error:', error, info);
	};

	return (
		<QueryErrorResetBoundary>
			{({ reset }) => (
				<ErrorBoundary
					onError={errorHandler}
					onReset={reset}
					fallbackRender={({ resetErrorBoundary }) => (
						<States>
							<StatesIcon name='circle-exclamation' />
							<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
							<StatesSubtitle>{isError(error) && error?.message}</StatesSubtitle>
							<StatesActions>
								<StatesAction onClick={(): void => resetErrorBoundary()}>{t('Retry')}</StatesAction>
							</StatesActions>
						</States>
					)}
				>
					{children}
				</ErrorBoundary>
			)}
		</QueryErrorResetBoundary>
	);
};

export default EngagementDashboardCardErrorBoundary;
