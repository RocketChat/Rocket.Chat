import { action } from '@storybook/addon-actions';
import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { Composer, ComposerActions, ComposerAction } from '.';
import PlusIcon from '../../icons/plus.svg';
import SendIcon from '../../icons/send.svg';
import SmileIcon from '../../icons/smile.svg';

const defaultPlaceholder = 'Insert your text here';

export default {
	title: 'Components/Composer',
	component: Composer,
	args: {
		value: '',
		placeholder: 'Insert your text here',
		onChange: action('change'),
		onSubmit: action('submit'),
		onUpload: action('upload'),
	},
	decorators: [(storyFn) => <div style={{ width: 365 }}>{storyFn()}</div>],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof Composer>>;

const Template: Story<ComponentProps<typeof Composer>> = (args) => <Composer {...args} />;

export const Default = Template.bind({});
Default.storyName = 'default';

export const WithLargePlaceholder = Template.bind({});
WithLargePlaceholder.storyName = 'with large placeholder';
WithLargePlaceholder.args = {
	placeholder: new Array(5).fill(defaultPlaceholder).join(' '),
};

export const WithPlainText = Template.bind({});
WithPlainText.storyName = 'with plain text';
WithPlainText.args = {
	value: 'Should I use &amp; or &?',
};

export const WithEmojis = Template.bind({});
WithEmojis.storyName = 'with emojis';
WithEmojis.args = {
	value: ":heart: :smile: :'(",
};

export const WithMentions = Template.bind({});
WithMentions.storyName = 'with mentions';
WithMentions.args = {
	value: "@all, I'm @here with @user.",
};

export const WithActions = Template.bind({});
WithActions.storyName = 'with actions';
WithActions.args = {
	pre: (
		<ComposerActions>
			<ComposerAction text='Add emoji' onClick={action('click smile')}>
				<SmileIcon width='20' />
			</ComposerAction>
			<ComposerAction text='Send' onClick={action('click send')}>
				<SendIcon color='info' width='20' />
			</ComposerAction>
		</ComposerActions>
	),
	post: (
		<ComposerActions>
			<ComposerAction text='Add attachment' onClick={action('click plus')}>
				<PlusIcon width='20' />
			</ComposerAction>
		</ComposerActions>
	),
};
