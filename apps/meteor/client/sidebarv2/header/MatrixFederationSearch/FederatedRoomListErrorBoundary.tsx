import { States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction, Icon } from '@rocket.chat/fuselage';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

type FederatedRoomListErrorBoundaryProps = {
	children?: ReactNode;
	resetKeys?: unknown[];
};

const FederatedRoomListErrorBoundary = ({ children, resetKeys }: FederatedRoomListErrorBoundaryProps) => {
	const { t } = useTranslation();

	return (
		<QueryErrorResetBoundary>
			{({ reset }) => (
				<ErrorBoundary
					children={children}
					resetKeys={resetKeys}
					fallbackRender={({ resetErrorBoundary }) => (
						<States>
							<StatesIcon name='circle-exclamation' variation='danger' />
							<StatesTitle>{t('Error')}</StatesTitle>
							<StatesSubtitle>{t('Error_something_went_wrong')}</StatesSubtitle>
							<StatesActions>
								<StatesAction
									onClick={() => {
										reset();
										resetErrorBoundary();
									}}
								>
									<Icon name='reload' /> {t('Reload')}
								</StatesAction>
							</StatesActions>
						</States>
					)}
				/>
			)}
		</QueryErrorResetBoundary>
	);
};

export default FederatedRoomListErrorBoundary;
