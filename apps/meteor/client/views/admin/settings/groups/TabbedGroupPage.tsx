import type { ISetting } from '@rocket.chat/core-typings';
import { Tabs } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo, useState, useMemo } from 'react';

import { useEditableSettingsGroupSections, useEditableSettingsGroupTabs } from '../../EditableSettingsContext';
import GroupPage from '../GroupPage';
import Section from '../Section';
import GenericGroupPage from './GenericGroupPage';

type TabbedGroupPageProps = ISetting & {
	headerButtons?: ReactElement;
};

function TabbedGroupPage({ _id, ...group }: TabbedGroupPageProps): JSX.Element {
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
