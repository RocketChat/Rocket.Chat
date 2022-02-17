import { Button, Tabs, Box, Accordion } from '@rocket.chat/fuselage';
import React, { memo, useMemo, useState } from 'react';

import type { ISetting } from '../../../../../definition/ISetting';
import Page from '../../../../components/Page';
import { useEditableSettingsGroupSections } from '../../../../contexts/EditableSettingsContext';
import { useEndpoint } from '../../../../contexts/ServerContext';
import { useSettings } from '../../../../contexts/SettingsContext';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { useTranslation, TranslationKey } from '../../../../contexts/TranslationContext';

// import { useEndpoint } from '../../../../contexts/ServerContext';
import GroupPage from '../GroupPage';
import Section from '../Section';
import VoipExtensionsPage from './voip/VoipExtensionsPage';

function VoipGroupPage({ _id, ...group }: ISetting): JSX.Element {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	// const testConnection = useEndpoint('POST', 'voip.testConnection');
	// const voipEnabled = useSetting('VOIP_Enabled');

	// const editableSettings = useEditableSettings(
	// 	useMemo(
	// 		() => ({
	// 			group: 'VoIP',
	// 		}),
	// 		[],
	// 	),
	// );

	// const changed = useMemo(() => editableSettings.some(({ changed }) => changed), [editableSettings]);

	// const handleTestConnectionButtonClick = async (): Promise<void> => {
	// try {
	// 	const { message } = await testConnection();
	// 	dispatchToastMessage({ type: 'success', message: t(message) });
	// } catch (error) {
	// 	dispatchToastMessage({ type: 'error', message: error });
	// }
	// };

	const tabs = ['Server_Configuration', 'Extensions'];

	// readonly _id?: string[] | undefined;
	// readonly group?: string | undefined;
	// readonly section?: string | undefined;
	// readonly tab?: string | undefined;

	// websocketUrl: Match.Maybe(String),
	// host: Match.Maybe(String),
	// port: Match.Maybe(String),
	// path: Match.Maybe(String),

	const [tab, setTab] = useState(tabs[0]);
	const handleTabClick = useMemo(() => (tab: string) => (): void => setTab(tab), [setTab]);
	const sections = useEditableSettingsGroupSections('VoIP', tab);
	const serverConfig = useSettings(
		useMemo(() => ({ _id: ['VoIP_Server_Host', 'VoIP_Server_Websocket_Port', 'VoIP_Server_Name', 'VoIP_Server_Websocket_Path'] }), []),
	);

	const testConnectionParams = useMemo(
		() => ({
			websocketUrl: serverConfig.find(({ _id }) => _id === 'VoIP_Server_Websocket_Path')?.value as string,
			host: serverConfig.find(({ _id }) => _id === 'VoIP_Server_Host')?.value as string,
			port: serverConfig.find(({ _id }) => _id === 'VoIP_Server_Websocket_Port')?.value as string,
			path: serverConfig.find(({ _id }) => _id === 'VoIP_Server_Websocket_Path')?.value as string,
		}),
		[serverConfig],
	);

	const testConnection = useEndpoint('GET', 'voip/callServer/checkConnection', testConnectionParams);

	console.log('VoipGroupPage', testConnectionParams);

	const handleTestConnectionButtonClick = async (): Promise<void> => {
		try {
			const result = await testConnection;
			console.log('handleTestConnectionButtonClick', result);
			dispatchToastMessage({ type: 'success', message: t(result) });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	console.log(group);

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

	const TestConnectionButton = <Button onClick={handleTestConnectionButtonClick}>{t('Test_Connection')}</Button>;

	return (
		<GroupPage _id={_id} {...group} tabs={tabsComponent} isCustom={true} headerButtons={tab === 'Extensions' ? null : TestConnectionButton}>
			{tab === 'Extensions' ? (
				<VoipExtensionsPage />
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
