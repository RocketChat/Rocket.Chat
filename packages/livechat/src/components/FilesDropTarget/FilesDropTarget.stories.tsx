import type { Meta, StoryObj } from '@storybook/preact';
import type { ComponentProps } from 'preact';
import { createRef } from 'preact';
import { action } from 'storybook/actions';

import { FilesDropTarget } from '.';
import { Button } from '../Button';

const DummyContent = () => (
	<div
		style={{
			display: 'flex',
			width: '100vw',
			height: '100vh',
			alignItems: 'center',
			justifyContent: 'center',
			flexDirection: 'column',
		}}
	>
		Drop files here
		<span style={{ border: '1px solid', padding: '1rem', margin: '1rem' }}>Or into this span</span>
	</div>
);

export default {
	component: FilesDropTarget,
	args: {
		overlayed: false,
		overlayText: '',
		accept: '',
		multiple: false,
		onUpload: action('upload'),
	},
	parameters: {
		layout: 'fullscreen',
	},
	render: (args) => (
		<FilesDropTarget {...args}>
			<DummyContent />
		</FilesDropTarget>
	),
} satisfies Meta<ComponentProps<typeof FilesDropTarget>>;

type Story = StoryObj<ComponentProps<typeof FilesDropTarget>>;

export const Default: Story = {
	name: 'default',
	args: {},
};

export const Overlayed: Story = {
	name: 'overlayed',
	args: {
		overlayed: true,
	},
};

export const OverlayedWithText: Story = {
	name: 'overlayed with text',
	args: {
		overlayed: true,
		overlayText: 'You can release your files now',
	},
};

export const AcceptingOnlyImages: Story = {
	name: 'accepting only images',
	args: {
		accept: 'image/*',
	},
};

export const AcceptingMultipleFiles: Story = {
	name: 'accepting multiple files',
	args: {
		multiple: true,
	},
};

const inputRef = createRef();
export const TriggeringBrowseAction: Story = {
	name: 'triggering browse action',
	args: {
		children: (
			<div
				style={{
					display: 'flex',
					width: '100vw',
					height: '100vh',
					alignItems: 'center',
					justifyContent: 'center',
					flexDirection: 'column',
				}}
			>
				<Button onClick={() => inputRef.current.browse()}>Browse</Button>
			</div>
		),
		inputRef,
	},
};
