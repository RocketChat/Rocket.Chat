import { BlockContext } from '@rocket.chat/ui-kit';
import { action } from '@storybook/addon-actions';

import ButtonElement from '.';
import { parser } from '..';
import Surface from '../Surface';

export default {
	title: 'UiKit/Message/Button element',
	parameters: {
		layout: 'centered',
	},
	decorators: [
		(storyFn) => (
			<Surface
				children={storyFn()}
				dispatchAction={async (payload) => {
					await new Promise((resolve) => setTimeout(resolve, 1000));
					action('dispatchAction')(payload);
				}}
			/>
		),
	],
	argTypes: {
		text: { control: 'object' },
		actionId: { control: 'text' },
		url: { control: 'text' },
		value: { control: 'text' },
		style: { control: { type: 'inline-radio', options: [null, 'primary', 'danger'] } },
		context: { control: { type: 'select', options: BlockContext } },
	},
	args: {
		text: { type: 'plain_text', text: 'Click Me' },
		actionId: undefined,
		url: undefined,
		value: undefined,
		style: null,
		context: undefined,
		confirm: undefined,
	},
};

export const Default = (args) => <ButtonElement {...args} parser={parser} />;
Default.storyName = 'default';
