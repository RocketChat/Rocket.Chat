import type { Decorator, Meta, StoryObj } from '@storybook/react-webpack5';
import { useState } from 'react';

import { Box } from '../Box';
import { Button, IconButton } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { Menu, MenuItem } from '../Menu';
import SplitButton from './SplitButton';
import SplitButtonTrigger from './SplitButtonTrigger';

export default {
	title: 'Inputs/SplitButton',
	component: SplitButton,
	parameters: {
		docs: {
			description: {
				component:
					'Fuses a menu trigger and its primary action into a single control, with no gap and group-level rounded corners.\n\n' +
					'The `SplitButtonTrigger` is a **ghost** segment: it stays transparent so the translucent group background (the secondary button background at 70% opacity) shows through. Pass it as the `Menu` `button`, next to the primary action.\n\n' +
					"A variant set on the group (`danger`, `warning`, `success`, `primary`) keeps its identity on the ghost segment: the group background, the trigger glyph and its hover/active/focus feedback use the variant's own tokens at the same 70% translucency.\n\n" +
					'**Rules**\n' +
					'- Exactly two children: a `Menu` whose `button` is a `SplitButtonTrigger`, and the primary action.\n' +
					'- Set `danger` on the group when the action is destructive, and make the action `secondary danger`. Likewise, match `warning`, `success` or `primary` on the group to the action variant.\n' +
					'- Name the group with `aria-label` (or `aria-labelledby`) — it is announced when focus enters it.\n' +
					'- For toggles (microphone, camera), set `aria-pressed` on the action.\n' +
					'- Keep both segments the same size.',
			},
		},
	},
} satisfies Meta<typeof SplitButton>;

type Story = StoryObj<typeof SplitButton>;

// Surface behind the stories so ghost translucency reads in both themes.
const withLightSurface: Decorator = (Story) => (
	<Box backgroundColor='light' padding='x16'>
		<Story />
	</Box>
);

const devices = [
	{ id: 'built-in', label: 'Built-in Microphone' },
	{ id: 'headset', label: 'Headset' },
];

export const Default: Story = {
	decorators: [withLightSurface],
	render: function Render() {
		const [enabled, setEnabled] = useState(true);
		const [device, setDevice] = useState('built-in');

		return (
			<SplitButton aria-label='Microphone'>
				<Menu
					icon='kebab'
					button={<SplitButtonTrigger secondary small icon='kebab' />}
					aria-label='Audio settings'
					placement='top-start'
					selectionMode='single'
					selectedKeys={[device]}
					onSelectionChange={(keys) => {
						const [key] = keys as Set<string>;
						if (key) setDevice(key);
					}}
				>
					{devices.map(({ id, label }) => (
						<MenuItem key={id}>{label}</MenuItem>
					))}
				</Menu>
				<IconButton
					secondary
					small
					icon={enabled ? 'mic' : 'mic-off'}
					aria-label='Microphone'
					aria-pressed={enabled}
					onClick={() => setEnabled((enabled) => !enabled)}
				/>
			</SplitButton>
		);
	},
};

export const Danger: Story = {
	decorators: [withLightSurface],
	render: () => (
		<SplitButton danger aria-label='Leave call'>
			<Menu
				icon='chevron-up'
				button={<SplitButtonTrigger secondary small icon='chevron-up' />}
				aria-label='Leave options'
				placement='top-start'
			>
				<MenuItem key='end-for-all'>End call for everyone</MenuItem>
			</Menu>
			<IconButton secondary danger small icon='phone-off' aria-label='Leave call' />
		</SplitButton>
	),
};

export const Variants: Story = {
	decorators: [withLightSurface],
	render: () => (
		<Box display='flex' alignItems='center' gap='x16'>
			<SplitButton aria-label='Microphone'>
				<Menu
					icon='chevron-up'
					button={<SplitButtonTrigger secondary small icon='chevron-up' />}
					aria-label='Microphone options'
					placement='top-start'
				>
					<MenuItem key='built-in'>Built-in Microphone</MenuItem>
				</Menu>
				<IconButton secondary small icon='mic' aria-label='Microphone' />
			</SplitButton>
			<SplitButton danger aria-label='Leave call'>
				<Menu
					icon='chevron-up'
					button={<SplitButtonTrigger secondary small icon='chevron-up' />}
					aria-label='Leave options'
					placement='top-start'
				>
					<MenuItem key='end-for-all'>End call for everyone</MenuItem>
				</Menu>
				<IconButton secondary danger small icon='phone-off' aria-label='Leave call' />
			</SplitButton>
			<SplitButton warning aria-label='Raise hand'>
				<Menu
					icon='chevron-up'
					button={<SplitButtonTrigger secondary small icon='chevron-up' />}
					aria-label='Raise hand options'
					placement='top-start'
				>
					<MenuItem key='lower-all'>Lower all hands</MenuItem>
				</Menu>
				<IconButton secondary warning small icon='hand' aria-label='Raise hand' />
			</SplitButton>
			<SplitButton success aria-label='Answer call'>
				<Menu
					icon='chevron-up'
					button={<SplitButtonTrigger secondary small icon='chevron-up' />}
					aria-label='Answer options'
					placement='top-start'
				>
					<MenuItem key='audio-only'>Answer with audio only</MenuItem>
				</Menu>
				<IconButton secondary success small icon='phone' aria-label='Answer call' />
			</SplitButton>
			<SplitButton primary aria-label='Camera'>
				<Menu
					icon='chevron-up'
					button={<SplitButtonTrigger secondary small icon='chevron-up' />}
					aria-label='Camera options'
					placement='top-start'
				>
					<MenuItem key='built-in'>Built-in Camera</MenuItem>
				</Menu>
				<IconButton primary small icon='video' aria-label='Camera' />
			</SplitButton>
		</Box>
	),
	parameters: {
		docs: {
			description: {
				story:
					"The ghost trigger keeps the variant set on the group: its background, glyph and state feedback use the variant's own tokens at the same translucency as the default (secondary) ghost.",
			},
		},
	},
};

export const CallControls: Story = {
	decorators: [withLightSurface],
	render: function Render() {
		const [micOn, setMicOn] = useState(true);
		const [cameraOn, setCameraOn] = useState(true);
		const [captionsOn, setCaptionsOn] = useState(false);
		const [handRaised, setHandRaised] = useState(false);

		return (
			<ButtonGroup aria-label='Call controls'>
				<SplitButton aria-label='Microphone'>
					<Menu icon='kebab' button={<SplitButtonTrigger secondary small icon='kebab' />} aria-label='Audio settings' placement='top-start'>
						<MenuItem key='built-in'>Built-in Microphone</MenuItem>
						<MenuItem key='headset'>Headset</MenuItem>
					</Menu>
					<IconButton
						secondary
						small
						icon={micOn ? 'mic' : 'mic-off'}
						aria-label='Microphone'
						aria-pressed={micOn}
						onClick={() => setMicOn((on) => !on)}
					/>
				</SplitButton>
				<SplitButton aria-label='Camera'>
					<Menu
						icon='chevron-up'
						button={<SplitButtonTrigger secondary small icon='chevron-up' />}
						aria-label='Video settings'
						placement='top-start'
					>
						<MenuItem key='built-in'>Built-in Camera</MenuItem>
						<MenuItem key='external'>External Camera</MenuItem>
					</Menu>
					<IconButton
						secondary
						small
						icon={cameraOn ? 'video' : 'video-off'}
						aria-label='Camera'
						aria-pressed={cameraOn}
						onClick={() => setCameraOn((on) => !on)}
					/>
				</SplitButton>
				<IconButton secondary small icon='desktop-arrow-up' aria-label='Present now' />
				<IconButton secondary small icon='emoji' aria-label='Send a reaction' />
				<IconButton
					secondary
					small
					icon='closed-captions'
					aria-label='Captions'
					aria-pressed={captionsOn}
					onClick={() => setCaptionsOn((on) => !on)}
				/>
				<IconButton
					secondary
					small
					icon='hand'
					aria-label='Raise hand'
					aria-pressed={handRaised}
					onClick={() => setHandRaised((raised) => !raised)}
				/>
				<Menu icon='kebab' button={<IconButton secondary small icon='kebab' />} aria-label='More options' placement='top-end'>
					<MenuItem key='settings'>Settings</MenuItem>
					<MenuItem key='report'>Report a problem</MenuItem>
				</Menu>
				<Button variant='danger' size='small' square icon='phone-off' aria-label='Leave call' />
			</ButtonGroup>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					'Video-call controls: `SplitButton`s for the microphone and camera (each device toggle paired with a ghost menu segment that opens the device selection), laid out in a `ButtonGroup` next to standalone toggles, a regular `Menu` and the leave action. Only the split buttons are fused; the group keeps its 8px gap between controls.',
			},
		},
	},
};
