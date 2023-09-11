import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { FileAttachment } from '.';
import { loremIpsum } from '../../../../.storybook/helpers';

export default {
	title: 'Messages/FileAttachment',
	component: FileAttachment,
	args: {
		title: 'Untitled',
	},
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof FileAttachment>>;

const Template: Story<ComponentProps<typeof FileAttachment>> = (args) => <FileAttachment {...args} />;

export const PDF = Template.bind({});
PDF.storyName = 'for pdf';
PDF.args = {
	url: 'http://example.com/demo.pdf',
};

export const DOC = Template.bind({});
DOC.storyName = 'for doc';
DOC.args = {
	url: 'http://example.com/demo.doc',
};

export const PPT = Template.bind({});
PPT.storyName = 'for ppt';
PPT.args = {
	url: 'http://example.com/demo.ppt',
};

export const XLS = Template.bind({});
XLS.storyName = 'for xls';
XLS.args = {
	url: 'http://example.com/demo.xls',
};

export const ZIP = Template.bind({});
ZIP.storyName = 'for zip';
ZIP.args = {
	url: 'http://example.com/demo.zip',
};

export const UnknownExtension = Template.bind({});
UnknownExtension.storyName = 'for unknown extension';
UnknownExtension.args = {
	url: 'http://example.com/demo.abc',
};

export const WithLongTitle = Template.bind({});
WithLongTitle.storyName = 'with long title';
WithLongTitle.args = {
	title: loremIpsum({ count: 50, units: 'words' }),
	url: 'http://example.com/demo.abc',
};
WithLongTitle.decorators = [(storyFn) => <div style={{ width: 365 }}>{storyFn()}</div>];
