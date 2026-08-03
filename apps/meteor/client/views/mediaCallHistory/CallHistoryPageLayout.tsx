import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import CallHistoryPageFilters, { type CallHistoryPageFiltersProps } from './CallHistoryPageFilters';
import OngoingCallsList from './OngoingCallsList';

export type CallHistoryPageLayoutProps = {
	children: ReactNode;
	contextualBar?: ReactNode;
	filterProps: CallHistoryPageFiltersProps;
};

const CallHistoryPageLayout = ({ children, contextualBar, filterProps }: CallHistoryPageLayoutProps) => {
	const { t } = useTranslation();

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Call_history')} />
				<PageContent>
					<CallHistoryPageFilters {...filterProps} />
					{/* Above the record of past calls, and outside the three states the table itself renders — a
					    call in progress is worth reaching whether or not the history below has loaded or is empty. */}
					<OngoingCallsList />
					{children}
				</PageContent>
			</Page>
			{contextualBar}
		</Page>
	);
};

export default CallHistoryPageLayout;
