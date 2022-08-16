import type { ISetting } from '@rocket.chat/core-typings';
import { Tabs, Box, Accordion } from '@rocket.chat/fuselage';
import { useSetting, useTranslation, TranslationKey } from '@rocket.chat/ui-contexts';
import React, { memo, useMemo, useState } from 'react';

import NoResults from '../../../../components/GenericTable/NoResults';
import Page from '../../../../components/Page';
import { useEditableSettingsGroupSections } from '../../EditableSettingsContext';
import GroupPage from '../GroupPage';
import Section from '../Section';
import VoipExtensionsPage from './voip/VoipExtensionsPage';

function VoipGroupPage({ _id, ...group }: ISetting): JSX.Element {
	const t = useTranslation();
	const voipEnabled = useSetting('VoIP_Enabled');

	const tabs = ['Settings', 'Extensions'];

	const [tab, setTab] = useState(tabs[0]);
	const handleTabClick = useMemo(() => (tab: string) => (): void => setTab(tab), [setTab]);
	const sections = useEditableSettingsGroupSections('Call_Center', tab);

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

	const ExtensionsPageComponent = useMemo(
		() =>
			voipEnabled ? (
				<VoipExtensionsPage />
			) : (
				<NoResults icon='warning' title={t('Voip_is_disabled')} description={t('Voip_is_disabled_description')}></NoResults>
			),
		[t, voipEnabled],
	);

	return (
		<GroupPage _id={_id} {...group} tabs={tabsComponent} isCustom={true}>
			{tab === 'Extensions' ? (
				ExtensionsPageComponent
			) : (
				<Page.ScrollableContentWithShadow>
					<Box marginBlock='none' marginInline='auto' width='full' maxWidth='x580'>
						<Accordion className='page-settings'>
							{sections.map((sectionName) => (
								<Section key={sectionName || ''} groupId={_id} sectionName={sectionName} tabName={tab} solo={false} />
							))}
						</Accordion>
					</Box>
				</Page.ScrollableContentWithShadow>
			)}
		</GroupPage>
	);
}

export default memo(VoipGroupPage);
