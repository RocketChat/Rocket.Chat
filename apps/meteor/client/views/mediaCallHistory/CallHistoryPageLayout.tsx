import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import CallHistoryPageFilters, { type CallHistoryPageFiltersProps } from './CallHistoryPageFilters';

type CallHistoryPageLayoutProps = {
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
					{children}
				</PageContent>
			</Page>
			{contextualBar}
		</Page>
	);
};

export default CallHistoryPageLayout;
