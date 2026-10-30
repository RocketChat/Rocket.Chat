import '@rocket.chat/fuselage/dist/fuselage.css';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { createRoot } from 'react-dom/client';

import * as stories from '../LocalMessageSearchResults.stories';

const { Default, WithoutAvatars, Empty } = composeStories(stories);
const root = createRoot(document.getElementById('root')!);
const AppRoot = mockAppRoot()
	.withSetting('Message_DateFormat', 'YYYY-MM-DD')
	.withSetting('Message_TimeFormat', 'HH:mm')
	.withSetting('Message_TimeAndDateFormat', 'YYYY-MM-DD HH:mm')
	.build();
const openedHits: string[] = [];
const previews = { Default, WithoutAvatars, Empty };
const show = (name: keyof typeof previews) => {
	const Preview = previews[name];
	root.render(
		<AppRoot>
			<Preview onOpenHit={(hit) => openedHits.push(hit.id)} />
		</AppRoot>,
	);
};

declare global {
	interface Window {
		e2eeSearchUiPreview: { show: typeof show; openedHits: string[] };
	}
}

window.e2eeSearchUiPreview = { show, openedHits };
show('Default');
