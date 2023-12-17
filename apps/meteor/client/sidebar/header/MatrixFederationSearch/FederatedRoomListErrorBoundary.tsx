import { States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

type FederatedRoomListErrorBoundaryProps = {
	children?: ReactNode;
	resetKeys?: unknown[];
};

const FederatedRoomListErrorBoundary = ({ children, resetKeys }: FederatedRoomListErrorBoundaryProps): ReactElement => {
	const t = useTranslation();
	return (
		<QueryErrorResetBoundary>
			{({ reset }): ReactElement => (
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
