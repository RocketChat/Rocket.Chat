import { Button } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { action } from 'storybook/actions';
import { userEvent, within } from 'storybook/test';

import DeviceMenu from './DeviceMenu';
import { DeviceSelectionProvider } from './DeviceSelectionContext';

const devices = [
	{ deviceId: 'facetime', kind: 'videoinput', label: 'FaceTime HD Camera', groupId: 'built-in' },
	{ deviceId: 'brio', kind: 'videoinput', label: 'Logitech BRIO (046d:085e)', groupId: 'brio' },
] as unknown as MediaDeviceInfo[];

/** Every kind of row a device menu can hold. */
const meta = {
	component: DeviceMenu,
	parameters: { layout: 'centered' },
	decorators: [
		(Story) => (
			<DeviceSelectionProvider value={{ devices, selectedIds: { videoinput: 'facetime' }, select: action('select') }}>
				<Story />
			</DeviceSelectionProvider>
		),
	],
	args: {
		kinds: ['videoinput'],
		title: 'Camera',
		placement: 'top-start',
		button: <Button>Camera</Button>,
	},
} satisfies Meta<typeof DeviceMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RowKinds: Story = {
	render: (args) => {
		const [quality, setQuality] = useState('auto');
		const [on, setOn] = useState(false);
		return (
			<DeviceMenu
				{...args}
				choices={[
					{
						title: 'Video quality',
						choices: ['auto', '720p', '360p'].map((id) => ({
							type: 'choice' as const,
							id,
							name: id === 'auto' ? 'Auto' : id,
							selected: id === quality,
							onSelect: () => setQuality(id),
						})),
					},
					{
						title: 'Background',
						choices: [
							{ type: 'toggle', id: 'effect', name: 'Background effect', checked: on, onToggle: () => setOn(!on) },
							{ type: 'action', id: 'settings', name: 'Background settings…', onAction: action('openSettings') },
						],
					},
				]}
			/>
		);
	},
	play: async ({ canvasElement }) => {
		await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Camera' }));
	},
};
