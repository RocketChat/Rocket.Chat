import { Tabs, TabsItem } from '@rocket.chat/fuselage';
import { Page, PageContent, PageHeader } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

export type CallHistoryTab = 'calls' | 'contacts';

export type CallHistoryPageLayoutProps = {
	children: ReactNode;
	contextualBar?: ReactNode;
	filters: ReactNode;
	tab: CallHistoryTab;
	onChangeTab: (tab: CallHistoryTab) => void;
};

const CallHistoryPageLayout = ({ children, contextualBar, filters, tab, onChangeTab }: CallHistoryPageLayoutProps) => {
	const { t } = useTranslation();

	const callsTabId = useId();
	const contactsTabId = useId();
	const panelId = useId();

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Call_history')} />
				<Tabs>
					<TabsItem id={callsTabId} aria-controls={panelId} selected={tab === 'calls'} onClick={() => onChangeTab('calls')}>
						{t('Calls')}
					</TabsItem>
					<TabsItem id={contactsTabId} aria-controls={panelId} selected={tab === 'contacts'} onClick={() => onChangeTab('contacts')}>
						{t('Contacts')}
					</TabsItem>
				</Tabs>
				<PageContent role='tabpanel' id={panelId} aria-labelledby={tab === 'calls' ? callsTabId : contactsTabId}>
					{filters}
					{children}
				</PageContent>
			</Page>
			{contextualBar}
		</Page>
	);
};

export default CallHistoryPageLayout;
