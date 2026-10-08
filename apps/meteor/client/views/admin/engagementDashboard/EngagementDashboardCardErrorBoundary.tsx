import { States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import CopyErrorReportAction from '../../../components/ErrorReport/CopyErrorReportAction';
import ReportableErrorBoundary from '../../../components/ErrorReport/ReportableErrorBoundary';

export type EngagementDashboardCardErrorBoundaryProps = {
	children?: ReactNode;
};

const EngagementDashboardCardErrorBoundary = ({ children }: EngagementDashboardCardErrorBoundaryProps) => {
	const { t } = useTranslation();

	const errorHandler = (error: unknown, info: { componentStack?: string | null }): void => {
		console.error('Uncaught Error:', error, info);
	};

	return (
		<QueryErrorResetBoundary>
			{({ reset }) => (
				<ReportableErrorBoundary
					onError={errorHandler}
					onReset={reset}
					fallbackRender={({ error, componentStack, resetErrorBoundary }) => (
						<States>
							<StatesIcon name='circle-exclamation' />
							<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
							<StatesSubtitle>{error instanceof Error && error.message}</StatesSubtitle>
							<StatesActions>
								<CopyErrorReportAction error={error} componentStack={componentStack} />
								<StatesAction onClick={(): void => resetErrorBoundary()}>{t('Retry')}</StatesAction>
							</StatesActions>
						</States>
					)}
				>
					{children}
				</ReportableErrorBoundary>
			)}
		</QueryErrorResetBoundary>
	);
};

export default EngagementDashboardCardErrorBoundary;
