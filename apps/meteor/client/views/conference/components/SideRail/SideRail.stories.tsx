import type { Meta, StoryFn } from '@storybook/react';
import { action } from 'storybook/actions';

import { SideRail, SideRailActions, SideRailAction, SideRailPanel } from '.';

export default {
	component: SideRail,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof SideRail>;

const PanelContent = () => (
	<div style={{ padding: 16 }}>
		<p>Panel content</p>
	</div>
);

export const Default: StoryFn<typeof SideRail> = () => (
	<div style={{ display: 'flex', height: 400 }}>
		<SideRail>
			<SideRailActions>
				<SideRailAction icon='chat' label='Chat' onClick={action('onClick')} />
			</SideRailActions>
		</SideRail>
	</div>
);

export const WithOpenPanel: StoryFn<typeof SideRail> = () => (
	<div style={{ display: 'flex', height: 400 }}>
		<SideRail>
			<SideRailActions>
				<SideRailAction pressed icon='chat' label='Chat' onClick={action('onClick')} />
			</SideRailActions>
			<SideRailPanel visible>
				<PanelContent />
			</SideRailPanel>
		</SideRail>
	</div>
);

export const WithClosedPanel: StoryFn<typeof SideRail> = () => (
	<div style={{ display: 'flex', height: 400 }}>
		<SideRail>
			<SideRailActions>
				<SideRailAction icon='chat' label='Chat' onClick={action('onClick')} />
			</SideRailActions>
			<SideRailPanel visible={false}>
				<PanelContent />
			</SideRailPanel>
		</SideRail>
	</div>
);

export const WithOverlayPanel: StoryFn<typeof SideRail> = () => (
	<div style={{ display: 'flex', height: 400, position: 'relative' }}>
		<div style={{ flex: 1, background: '#eee', padding: 16 }}>Main content</div>
		<SideRail>
			<SideRailActions>
				<SideRailAction pressed icon='chat' label='Chat' onClick={action('onClick')} />
			</SideRailActions>
			<SideRailPanel visible overlay>
				<PanelContent />
			</SideRailPanel>
		</SideRail>
	</div>
);

export const MultipleActions: StoryFn<typeof SideRail> = () => (
	<div style={{ display: 'flex', height: 400 }}>
		<SideRail>
			<SideRailActions>
				<SideRailAction pressed icon='chat' label='Chat' onClick={action('onClick')} />
				<SideRailAction icon='team' label='Team' onClick={action('onClick')} />
				<SideRailAction icon='kebab' label='More' onClick={action('onClick')} />
			</SideRailActions>
			<SideRailPanel visible>
				<PanelContent />
			</SideRailPanel>
		</SideRail>
	</div>
);
