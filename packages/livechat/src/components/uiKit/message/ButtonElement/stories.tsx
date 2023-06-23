import { BlockContext } from '@rocket.chat/ui-kit';
import { action } from '@storybook/addon-actions';
import type { ComponentMeta, ComponentStory } from '@storybook/react';

import ButtonElement from '.';
import { parser } from '..';
import Surface from '../Surface';

export default {
	title: 'UiKit/Message/Button element',
	args: {
		text: { type: 'plain_text', text: 'Click Me' },
		actionId: undefined,
		url: undefined,
		value: undefined,
		style: null,
		context: undefined,
		confirm: undefined,
	},
	argTypes: {
		text: { control: 'object' },
		actionId: { control: 'text' },
		url: { control: 'text' },
		value: { control: 'text' },
		style: { control: { type: 'inline-radio', options: [null, 'primary', 'danger'] } },
		context: { control: { type: 'select', options: BlockContext } },
	},
	decorators: [
		(storyFn) => (
			<Surface
				children={storyFn()}
				dispatchAction={async (payload: unknown) => {
					await new Promise((resolve) => setTimeout(resolve, 1000));
					action('dispatchAction')(payload);
				}}
			/>
		),
	],
	parameters: {
		layout: 'centered',
	},
} as ComponentMeta<typeof ButtonElement>;

export const Default: ComponentStory<typeof ButtonElement> = (args) => <ButtonElement {...args} parser={parser} />;
Default.storyName = 'default';
