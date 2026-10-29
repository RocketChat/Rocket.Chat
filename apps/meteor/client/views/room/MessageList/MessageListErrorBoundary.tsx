import { States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction, Icon } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import CopyErrorReportAction from '../../../components/ErrorReport/CopyErrorReportAction';
import ReportableErrorBoundary from '../../../components/ErrorReport/ReportableErrorBoundary';
import { useRoom } from '../contexts/RoomContext';

export type MessageListErrorBoundaryProps = { children: ReactNode };

const MessageListErrorBoundary = ({ children }: MessageListErrorBoundaryProps) => {
	const { t } = useTranslation();
	const room = useRoom();

	return (
		<ReportableErrorBoundary
			resetKeys={[room._id]}
			fallbackRender={({ error, componentStack }) => (
				<States>
					<StatesIcon name='circle-exclamation' variation='danger' />
					<StatesTitle>{t('Error')}</StatesTitle>
					<StatesSubtitle>{t('Error_something_went_wrong')}</StatesSubtitle>
					<StatesActions>
						<CopyErrorReportAction error={error} componentStack={componentStack} />
						<StatesAction
							onClick={(): void => {
								location.reload();
							}}
						>
							<Icon name='reload' /> {t('Reload')}
						</StatesAction>
					</StatesActions>
				</States>
			)}
		>
			{children}
		</ReportableErrorBoundary>
	);
};

export default MessageListErrorBoundary;
