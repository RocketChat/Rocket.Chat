import { action } from '@storybook/addon-actions';
import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';
import { createRef } from 'preact';

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
	title: 'Components/FilesDropTarget',
	component: FilesDropTarget,
	args: {
		children: <DummyContent />,
		overlayed: false,
		overlayText: '',
		accept: '',
		multiple: false,
		onUpload: action('upload'),
		disabled: false,
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<ComponentProps<typeof FilesDropTarget>>;

const Template: Story<ComponentProps<typeof FilesDropTarget>> = (args) => <FilesDropTarget {...args} />;

export const Default = Template.bind({});
Default.storyName = 'default';
Default.args = {};

export const Overlayed = Template.bind({});
Overlayed.storyName = 'overlayed';
Overlayed.args = {
	overlayed: true,
};

export const OverlayedWithText = Template.bind({});
OverlayedWithText.storyName = 'overlayed with text';
OverlayedWithText.args = {
	overlayed: true,
	overlayText: 'You can release your files now',
};

export const AcceptingOnlyImages = Template.bind({});
AcceptingOnlyImages.storyName = 'accepting only images';
AcceptingOnlyImages.args = {
	accept: 'image/*',
};

export const AcceptingMultipleFiles = Template.bind({});
AcceptingMultipleFiles.storyName = 'accepting multiple files';
AcceptingMultipleFiles.args = {
	multiple: true,
};

export const TriggeringBrowseAction = Template.bind({});
TriggeringBrowseAction.storyName = 'triggering browse action';
const inputRef = createRef();
TriggeringBrowseAction.args = {
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
};
