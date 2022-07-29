import { withKnobs, text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { FileAttachment } from '.';
import { loremIpsum, centered } from '../../../helpers.stories';


const centeredWithWidth = (storyFn, ...args) => centered(() => (
	<div style={{ width: '365px' }}>
		{storyFn()}
	</div>
), ...args);

storiesOf('Messages/FileAttachment', module)
	.addDecorator(centeredWithWidth)
	.addDecorator(withKnobs)
	.add('for pdf', () => (
		<FileAttachment
			title={text('title', 'Untitle')}
			url={text('url', 'http://example.com/demo.pdf')}
		/>
	))
	.add('for doc', () => (
		<FileAttachment
			title={text('title', 'Untitle')}
			url={text('url', 'http://example.com/demo.doc')}
		/>
	))
	.add('for ppt', () => (
		<FileAttachment
			title={text('title', 'Untitle')}
			url={text('url', 'http://example.com/demo.ppt')}
		/>
	))
	.add('for xls', () => (
		<FileAttachment
			title={text('title', 'Untitle')}
			url={text('url', 'http://example.com/demo.xls')}
		/>
	))
	.add('for zip', () => (
		<FileAttachment
			title={text('title', 'Untitle')}
			url={text('url', 'http://example.com/demo.zip')}
		/>
	))
	.add('for unknown extension', () => (
		<FileAttachment
			title={text('title', 'Untitle')}
			url={text('url', 'http://example.com/demo.abc')}
		/>
	))
	.add('with long title', () => (
		<FileAttachment
			title={text('title', loremIpsum({ count: 50, units: 'words' }))}
			url={text('url', 'http://example.com/demo.abc')}
		/>
	));
