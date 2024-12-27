import type { ISetting } from '@rocket.chat/core-typings';
import { Tabs, Box, Accordion } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetting } from '@rocket.chat/ui-contexts';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import VoipExtensionsPage from './VoipExtensionsPage';
import GenericNoResults from '../../../../../components/GenericNoResults';
import { PageScrollableContentWithShadow } from '../../../../../components/Page';
import { useEditableSettingsGroupSections } from '../../../EditableSettingsContext';
import SettingsGroupPage from '../../SettingsGroupPage';
import SettingsSection from '../../SettingsSection';

type VoipGroupPageProps = ISetting & {
	onClickBack?: () => void;
};

function VoipGroupPage({ _id, onClickBack, ...group }: VoipGroupPageProps) {
	const { t } = useTranslation();
	const voipEnabled = useSetting('VoIP_Enabled');

	const tabs = ['Settings', 'Extensions'];

	const [tab, setTab] = useState(tabs[0]);
	const handleTabClick = useMemo(() => (tab: string) => (): void => setTab(tab), [setTab]);
	const sections = useEditableSettingsGroupSections('VoIP_Omnichannel', tab);

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
				<GenericNoResults icon='warning' title={t('Voip_is_disabled')} description={t('Voip_is_disabled_description')} />
			),
		[t, voipEnabled],
	);

	return (
		<SettingsGroupPage _id={_id} {...group} tabs={tabsComponent} isCustom={true} onClickBack={onClickBack}>
			{tab === 'Extensions' ? (
				ExtensionsPageComponent
			) : (
				<PageScrollableContentWithShadow>
					<Box marginBlock='none' marginInline='auto' width='full' maxWidth='x580'>
						<Accordion>
							{sections.map((sectionName) => (
								<SettingsSection key={sectionName || ''} groupId={_id} sectionName={sectionName} currentTab={tab} solo={false} />
							))}
						</Accordion>
					</Box>
				</PageScrollableContentWithShadow>
			)}
		</SettingsGroupPage>
	);
}

export default memo(VoipGroupPage);
