import { TextInput, Box, Icon } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import GenericNoResults from './GenericNoResults';

export default {
	component: GenericNoResults,
	parameters: {
		layout: 'padded',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [
		(fn) => <div style={{ height: '100vh', maxHeight: 300, display: 'flex', flexDirection: 'column', marginInline: 24 }}>{fn()}</div>,
	],
} satisfies Meta<typeof GenericNoResults>;

const filter = (
	<>
		<Box mb={16} is='form' display='flex' flexDirection='column'>
			<TextInput flexShrink={0} placeholder='Search...' addon={<Icon name='magnifier' size='x20' />} />
		</Box>
	</>
);

export const NoResults: StoryFn<typeof GenericNoResults> = () => (
	<>
		{filter}
		<GenericNoResults />
	</>
);
