import '@rocket.chat/fuselage/dist/fuselage.css';
import '@rocket.chat/icons/dist/rocketchat.css';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';

import type { PreviewMode } from './browserRuntime';
import { evidence, preparePreview, setPreviewMode } from './browserRuntime';
import { setSearchIndexOptIn } from '../../../../../lib/e2eeSearch/searchIndexOptIn';
import MessageSearchTab from '../MessageSearchTab';

const provider = {
	key: 'defaultProvider',
	description: '',
	icon: 'magnifier',
	resultTemplate: '',
	supportsSuggestions: false,
	settings: { GlobalSearchEnabled: true },
};
const Root = mockAppRoot()
	.withJohnDoe()
	.withSetting('PageSize', 10)
	.withSetting('E2E_Enable_Local_Search', true)
	.withSetting('UI_Use_Real_Name', true)
	.withSetting('Message_DateFormat', 'YYYY-MM-DD')
	.withSetting('Message_TimeFormat', 'HH:mm')
	.withSetting('Message_TimeAndDateFormat', 'YYYY-MM-DD HH:mm')
	.withUserPreference('displayAvatars', true)
	.withMethod('rocketchatSearch.getProvider', () => provider)
	.withMethod('rocketchatSearch.search', () => {
		evidence.serverQueries++;
		return { message: { docs: [] } };
	})
	.withRouter({
		getRouteName: () => 'home',
		getRouteParameters: () => ({ rid: 'room' }),
		getSearchParameters: () => ({}),
		navigate: (route) => evidence.threadRoutes.push(route),
	})
	.withTranslations('en', 'core', {
		Search_Messages: 'Search messages',
		Global_Search: 'Global search',
		No_results_found: 'No results found',
		Encrypted_content_cannot_be_searched: 'Encrypted content cannot be searched.',
		Encrypted_RoomType: 'Encrypted {{roomType}}',
		Jump_to_message: 'Jump to message',
		Close: 'Close',
		E2E_Local_Search_Indexing_Progress_one: 'Indexing encrypted history: {{done}} of {{count}} room',
		E2E_Local_Search_Indexing_Progress_other: 'Indexing encrypted history: {{done}} of {{count}} rooms',
		E2E_Local_Search_Memory_Only: 'On this device, the app keeps the search index in memory only and builds it again after a restart.',
		E2E_Local_Search_Locked: 'Local search is locked on this device. Unlock end-to-end encryption to search encrypted messages.',
		E2E_Local_Search_Unavailable: 'Local search is unavailable on this device. Try again later.',
		Search_message_search_failed: 'Search request failed',
	})
	.build();

let show: (mode: PreviewMode) => void;
const ControllerPreview = () => {
	const [mode, setMode] = useState<PreviewMode>('indexing');
	show = (next) => {
		setPreviewMode(next);
		setMode(next);
	};
	return (
		<Root>
			<MessageSearchTab key={mode} />
		</Root>
	);
};

declare global {
	interface Window {
		e2eeSearchControllerPreview: { show: (mode: PreviewMode) => void; evidence: typeof evidence };
	}
}

setSearchIndexOptIn(`${window.location.origin}/`, 'john.doe', true);
void preparePreview().then(() => {
	window.e2eeSearchControllerPreview = { show: (mode) => show(mode), evidence };
	createRoot(document.getElementById('root')!).render(<ControllerPreview />);
});
