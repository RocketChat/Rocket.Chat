import { Tabs, TabsItem } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import GenericGroupPage from './GenericGroupPage';
import { useEditableSettingsGroupSections } from '../../EditableSettingsContext';

type TabbedGroupPageProps = {
	headerButtons?: ReactElement;
	_id: string;
	i18nLabel: string;
	tabs: string[];
	onClickBack?: () => void;
};

function TabbedGroupPage({ _id, tabs, i18nLabel, onClickBack, ...props }: TabbedGroupPageProps) {
	const { t } = useTranslation();

	const [currentTab, setCurrentTab] = useState(tabs[0]);
	const handleTabClick = useMemo(() => (tab: string) => (): void => setCurrentTab(tab), [setCurrentTab]);
	const sections = useEditableSettingsGroupSections(_id, currentTab);

	const tabsComponent = (
		<Tabs>
			{tabs.map((tabName) => (
				<TabsItem key={tabName || ''} selected={currentTab === tabName} onClick={handleTabClick(tabName)}>
					{tabName ? t(tabName as TranslationKey) : t(_id as TranslationKey)}
				</TabsItem>
			))}
		</Tabs>
	);

	return (
		<GenericGroupPage
			_id={_id}
			i18nLabel={i18nLabel}
			onClickBack={onClickBack}
			sections={sections}
			currentTab={currentTab}
			tabs={tabsComponent}
			{...props}
		/>
	);
}

export default memo(TabbedGroupPage);
