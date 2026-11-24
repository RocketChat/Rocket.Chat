import { Tabs, TabsItem } from '@rocket.chat/fuselage';
import { Page, PageContent } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

export type CallHistoryTab = 'calls' | 'contacts' | 'favorites';

export type CallHistoryPageLayoutProps = {
	children: ReactNode;
	contextualBar?: ReactNode;
	filters: ReactNode;
	tab: CallHistoryTab;
	onChangeTab: (tab: CallHistoryTab) => void;
};

const CallHistoryPageLayout = ({ children, contextualBar, filters, tab, onChangeTab }: CallHistoryPageLayoutProps) => {
	const { t } = useTranslation();

	const tabIds: Record<CallHistoryTab, string> = { calls: useId(), contacts: useId(), favorites: useId() };
	const panelId = useId();

	return (
		<Page flexDirection='row'>
			<Page>
				<Tabs>
					<TabsItem id={tabIds.calls} aria-controls={panelId} selected={tab === 'calls'} onClick={() => onChangeTab('calls')}>
						{t('Calls')}
					</TabsItem>
					<TabsItem id={tabIds.contacts} aria-controls={panelId} selected={tab === 'contacts'} onClick={() => onChangeTab('contacts')}>
						{t('Contacts')}
					</TabsItem>
					<TabsItem id={tabIds.favorites} aria-controls={panelId} selected={tab === 'favorites'} onClick={() => onChangeTab('favorites')}>
						{t('Favorites')}
					</TabsItem>
				</Tabs>
				<PageContent role='tabpanel' id={panelId} aria-labelledby={tabIds[tab]}>
					{filters}
					{children}
				</PageContent>
			</Page>
			{contextualBar}
		</Page>
	);
};

export default CallHistoryPageLayout;
