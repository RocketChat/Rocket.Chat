import type { Decorator, Meta, StoryObj } from '@storybook/react';
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
			usage: `
- Put exactly two children in a \`SplitButton\`: a \`Menu\` whose \`button\` is a \`SplitButtonTrigger\`, and the action.
- Give both segments the same \`size\`.
- For a destructive action, set \`danger\` on the group and \`variant='secondary-danger'\` on the action. Likewise, match \`warning\`, \`success\` or \`primary\` on the group to the action's variant.
- Name the group with \`aria-label\` or \`aria-labelledby\`: it is announced when focus enters it.
- For a toggle, such as a microphone or a camera, set \`aria-pressed\` on the action.
`,
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
	parameters: {
		docs: {
			description: {
				story: 'Click the microphone to toggle it, and the trigger to pick a device.',
			},
		},
	},
	render: function Render() {
		const [enabled, setEnabled] = useState(true);
		const [device, setDevice] = useState('built-in');

		return (
			<SplitButton aria-label='Microphone'>
				<Menu
					icon='kebab'
					button={<SplitButtonTrigger variant='secondary' size='small' icon='kebab' />}
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
					variant='secondary'
					size='small'
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
				button={<SplitButtonTrigger variant='secondary' size='small' icon='chevron-up' />}
				aria-label='Leave options'
				placement='top-start'
			>
				<MenuItem key='end-for-all'>End call for everyone</MenuItem>
			</Menu>
			<IconButton variant='secondary-danger' size='small' icon='phone-off' aria-label='Leave call' />
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
					button={<SplitButtonTrigger variant='secondary' size='small' icon='chevron-up' />}
					aria-label='Microphone options'
					placement='top-start'
				>
					<MenuItem key='built-in'>Built-in Microphone</MenuItem>
				</Menu>
				<IconButton variant='secondary' size='small' icon='mic' aria-label='Microphone' />
			</SplitButton>
			<SplitButton danger aria-label='Leave call'>
				<Menu
					icon='chevron-up'
					button={<SplitButtonTrigger variant='secondary' size='small' icon='chevron-up' />}
					aria-label='Leave options'
					placement='top-start'
				>
					<MenuItem key='end-for-all'>End call for everyone</MenuItem>
				</Menu>
				<IconButton variant='secondary-danger' size='small' icon='phone-off' aria-label='Leave call' />
			</SplitButton>
			<SplitButton warning aria-label='Raise hand'>
				<Menu
					icon='chevron-up'
					button={<SplitButtonTrigger variant='secondary' size='small' icon='chevron-up' />}
					aria-label='Raise hand options'
					placement='top-start'
				>
					<MenuItem key='lower-all'>Lower all hands</MenuItem>
				</Menu>
				<IconButton variant='secondary-warning' size='small' icon='hand' aria-label='Raise hand' />
			</SplitButton>
			<SplitButton success aria-label='Answer call'>
				<Menu
					icon='chevron-up'
					button={<SplitButtonTrigger variant='secondary' size='small' icon='chevron-up' />}
					aria-label='Answer options'
					placement='top-start'
				>
					<MenuItem key='audio-only'>Answer with audio only</MenuItem>
				</Menu>
				<IconButton variant='secondary-success' size='small' icon='phone' aria-label='Answer call' />
			</SplitButton>
			<SplitButton primary aria-label='Camera'>
				<Menu
					icon='chevron-up'
					button={<SplitButtonTrigger variant='secondary' size='small' icon='chevron-up' />}
					aria-label='Camera options'
					placement='top-start'
				>
					<MenuItem key='built-in'>Built-in Camera</MenuItem>
				</Menu>
				<IconButton variant='primary' size='small' icon='video' aria-label='Camera' />
			</SplitButton>
		</Box>
	),
	parameters: {
		docs: {
			description: {
				story: 'The variant set on the group tints the trigger to match the action beside it.',
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
					<Menu
						icon='kebab'
						button={<SplitButtonTrigger variant='secondary' size='small' icon='kebab' />}
						aria-label='Audio settings'
						placement='top-start'
					>
						<MenuItem key='built-in'>Built-in Microphone</MenuItem>
						<MenuItem key='headset'>Headset</MenuItem>
					</Menu>
					<IconButton
						variant='secondary'
						size='small'
						icon={micOn ? 'mic' : 'mic-off'}
						aria-label='Microphone'
						aria-pressed={micOn}
						onClick={() => setMicOn((on) => !on)}
					/>
				</SplitButton>
				<SplitButton aria-label='Camera'>
					<Menu
						icon='chevron-up'
						button={<SplitButtonTrigger variant='secondary' size='small' icon='chevron-up' />}
						aria-label='Video settings'
						placement='top-start'
					>
						<MenuItem key='built-in'>Built-in Camera</MenuItem>
						<MenuItem key='external'>External Camera</MenuItem>
					</Menu>
					<IconButton
						variant='secondary'
						size='small'
						icon={cameraOn ? 'video' : 'video-off'}
						aria-label='Camera'
						aria-pressed={cameraOn}
						onClick={() => setCameraOn((on) => !on)}
					/>
				</SplitButton>
				<IconButton variant='secondary' size='small' icon='desktop-arrow-up' aria-label='Present now' />
				<IconButton variant='secondary' size='small' icon='emoji' aria-label='Send a reaction' />
				<IconButton
					variant='secondary'
					size='small'
					icon='closed-captions'
					aria-label='Captions'
					aria-pressed={captionsOn}
					onClick={() => setCaptionsOn((on) => !on)}
				/>
				<IconButton
					variant='secondary'
					size='small'
					icon='hand'
					aria-label='Raise hand'
					aria-pressed={handRaised}
					onClick={() => setHandRaised((raised) => !raised)}
				/>
				<Menu
					icon='kebab'
					button={<IconButton variant='secondary' size='small' icon='kebab' />}
					aria-label='More options'
					placement='top-end'
				>
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
					'Microphone and camera `SplitButton`s in a `ButtonGroup`, beside standalone toggles, a `Menu` and the leave action. Only the split buttons are fused; the group keeps its gap between the other controls.',
			},
		},
	},
};
