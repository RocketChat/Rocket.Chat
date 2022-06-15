import { action } from '@storybook/addon-actions';
import { withKnobs, boolean, button, text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { FilesDropTarget } from '.';
import { centered } from '../../helpers.stories';


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
		<span style={{ padding: '1rem' }}>Or into this span</span>
	</div>
);

storiesOf('Components/FilesDropTarget', module)
	.addDecorator(centered)
	.addDecorator(withKnobs)
	.add('default', () => (
		<FilesDropTarget
			overlayed={boolean('overlayed', false)}
			overlayText={text('overlayText', '')}
			accept={text('accept', '')}
			multiple={boolean('multiple', false)}
			onUpload={action('upload')}
		>
			<DummyContent />
		</FilesDropTarget>
	))
	.add('overlayed', () => (
		<FilesDropTarget
			overlayed={boolean('overlayed', true)}
			overlayText={text('overlayText', '')}
			accept={text('accept', '')}
			multiple={boolean('multiple', false)}
			onUpload={action('upload')}
		>
			<DummyContent />
		</FilesDropTarget>
	))
	.add('overlayed with text', () => (
		<FilesDropTarget
			overlayed={boolean('overlayed', true)}
			overlayText={text('overlayText', 'You can release your files now')}
			accept={text('accept', '')}
			multiple={boolean('multiple', false)}
			onUpload={action('upload')}
		>
			<DummyContent />
		</FilesDropTarget>
	))
	.add('accepting only images', () => (
		<FilesDropTarget
			overlayed={boolean('overlayed', false)}
			overlayText={text('overlayText', '')}
			accept={text('accept', 'image/*')}
			multiple={boolean('multiple', false)}
			onUpload={action('upload')}
		>
			<DummyContent />
		</FilesDropTarget>
	))
	.add('accepting multiple', () => (
		<FilesDropTarget
			overlayed={boolean('overlayed', false)}
			overlayText={text('overlayText', '')}
			accept={text('accept', '')}
			multiple={boolean('multiple', true)}
			onUpload={action('upload')}
		>
			<DummyContent />
		</FilesDropTarget>
	))
	.add('triggering browse action', () => {
		let filesDropTarget;

		function handleRef(ref) {
			filesDropTarget = ref;
		}

		button('Browse for files', () => {
			filesDropTarget.browse();
		});

		return (
			<FilesDropTarget
				ref={handleRef}
				overlayed={boolean('overlayed', false)}
				overlayText={text('overlayText', '')}
				accept={text('accept', '')}
				multiple={boolean('multiple', false)}
				onUpload={action('upload')}
			/>
		);
	});
