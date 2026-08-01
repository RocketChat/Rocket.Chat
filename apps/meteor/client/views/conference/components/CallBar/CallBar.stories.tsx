import type { Meta, StoryFn } from '@storybook/react';
import { action } from 'storybook/actions';

import { CallBar, CallBarActions, CallBarAction } from '.';
import { CallPanel } from '../CallPanel';

export default {
	component: CallBar,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof CallBar>;

const PanelContent = () => (
	<div style={{ padding: 16 }}>
		<p>Panel content</p>
	</div>
);

const Call = () => <div style={{ flexGrow: 1, background: '#1f2329' }} />;

// The bar sits below the call area, and the panel opens beside the call *above* the bar — so the bar keeps
// its full width whatever the panel does.
const Conference = ({ chatVisible, overlay, children }: { chatVisible?: boolean; overlay?: boolean; children: React.ReactNode }) => (
	<div style={{ display: 'flex', flexDirection: 'column', height: 400 }}>
		<div style={{ display: 'flex', flexGrow: 1, minHeight: 0, position: 'relative' }}>
			<Call />
			{chatVisible !== undefined && (
				<CallPanel visible={chatVisible} overlay={overlay}>
					<PanelContent />
				</CallPanel>
			)}
		</div>
		{children}
	</div>
);

export const Default: StoryFn<typeof CallBar> = () => (
	<Conference>
		<CallBar>
			<CallBarActions placement='end'>
				<CallBarAction icon='balloon' label='Chat' onClick={action('onClick')} />
			</CallBarActions>
		</CallBar>
	</Conference>
);

export const WithOpenPanel: StoryFn<typeof CallBar> = () => (
	<Conference chatVisible>
		<CallBar>
			<CallBarActions placement='end'>
				<CallBarAction pressed icon='balloon' label='Chat' onClick={action('onClick')} />
			</CallBarActions>
		</CallBar>
	</Conference>
);

export const WithClosedPanel: StoryFn<typeof CallBar> = () => (
	<Conference chatVisible={false}>
		<CallBar>
			<CallBarActions placement='end'>
				<CallBarAction icon='balloon' label='Chat' onClick={action('onClick')} />
			</CallBarActions>
		</CallBar>
	</Conference>
);

export const WithOverlayPanel: StoryFn<typeof CallBar> = () => (
	<Conference chatVisible overlay>
		<CallBar>
			<CallBarActions placement='end'>
				<CallBarAction pressed icon='balloon' label='Chat' onClick={action('onClick')} />
			</CallBarActions>
		</CallBar>
	</Conference>
);

export const WithUnreadBadge: StoryFn<typeof CallBar> = () => (
	<Conference chatVisible={false}>
		<CallBar>
			<CallBarActions placement='end'>
				<CallBarAction icon='balloon' label='Chat' badgeCount={2} onClick={action('onClick')} />
			</CallBarActions>
		</CallBar>
	</Conference>
);

// Centred call controls with the chat action anchored at the end — the shape the native conference will
// use once it owns mic/camera/screen-share/hang-up.
export const WithCallControls: StoryFn<typeof CallBar> = () => (
	<Conference chatVisible>
		<CallBar>
			<CallBarActions>
				<CallBarAction icon='mic' label='Mute' onClick={action('onClick')} />
				<CallBarAction icon='video' label='Camera' onClick={action('onClick')} />
				<CallBarAction icon='desktop' label='Share screen' onClick={action('onClick')} />
				<CallBarAction icon='phone-off' label='Leave' onClick={action('onClick')} />
			</CallBarActions>
			<CallBarActions placement='end'>
				<CallBarAction pressed icon='balloon' label='Chat' badgeCount={2} onClick={action('onClick')} />
			</CallBarActions>
		</CallBar>
	</Conference>
);
