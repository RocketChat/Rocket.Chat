import type { ReactNode } from 'react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import GenericGroupPage from './GenericGroupPage';
import { PageTabs } from '../../../../components/PageTabs';
import { useEditableSettingsGroupSections } from '../../EditableSettingsContext';

export type TabbedGroupPageProps = {
	headerButtons?: ReactNode;
	_id: string;
	i18nLabel: string;
	tabs: string[];
	onClickBack?: () => void;
};

function TabbedGroupPage({ _id, tabs, i18nLabel, onClickBack, ...props }: TabbedGroupPageProps) {
	const { t } = useTranslation();

	const [currentTab, setCurrentTab] = useState(tabs[0]);
	const sections = useEditableSettingsGroupSections(_id, currentTab);

	const tabsComponent = (
		<PageTabs
			items={tabs.map((tabName) => ({ id: tabName, label: tabName ? t(tabName) : t(_id) }))}
			selected={currentTab}
			onSelect={setCurrentTab}
		/>
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
