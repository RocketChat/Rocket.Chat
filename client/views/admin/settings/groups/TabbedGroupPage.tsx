import { Tabs } from '@rocket.chat/fuselage';
import React, { ReactNode, memo, useState, useMemo } from 'react';

import { useEditableSettingsGroupSections, useEditableSettingsGroupTabs } from '../../../../contexts/EditableSettingsContext';
import { useTranslation, TranslationKey } from '../../../../contexts/TranslationContext';
import GroupPage from '../GroupPage';
import Section from '../Section';
import GenericGroupPage from './GenericGroupPage';

function TabbedGroupPage({
	_id,
	...group
}: {
	children?: ReactNode;
	headerButtons?: ReactNode;
	_id: string;
	i18nLabel: string;
	i18nDescription?: string;
	tabs?: ReactNode;
}): JSX.Element {
	const t = useTranslation();
	const tabs = useEditableSettingsGroupTabs(_id);

	const [tab, setTab] = useState(tabs[0]);
	const handleTabClick = useMemo(() => (tab: string) => (): void => setTab(tab), [setTab]);
	const sections = useEditableSettingsGroupSections(_id, tab);

	const solo = sections.length === 1;

	if (!tabs.length || (tabs.length === 1 && !tabs[0])) {
		return <GenericGroupPage _id={_id} {...group} />;
	}

	if (!tab && tabs[0]) {
		setTab(tabs[0]);
	}

	const tabsComponent = (
		<Tabs>
			{tabs.map((tabName) => (
				<Tabs.Item key={tabName || ''} selected={tab === tabName} onClick={handleTabClick(tabName)}>
					{tabName ? t(tabName as TranslationKey) : t(_id as TranslationKey)}
				</Tabs.Item>
			))}
		</Tabs>
	);

	return (
		<GroupPage _id={_id} {...group} tabs={tabsComponent}>
			{sections.map((sectionName) => (
				<Section key={sectionName || ''} groupId={_id} sectionName={sectionName} tabName={tab} solo={solo} />
			))}
		</GroupPage>
	);
}

export default memo(TabbedGroupPage);
