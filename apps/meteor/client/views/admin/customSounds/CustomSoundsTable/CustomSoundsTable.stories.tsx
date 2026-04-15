import { Margins } from '@rocket.chat/fuselage';
import { PageContent } from '@rocket.chat/ui-client';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';
import { useRef } from 'react';

import CustomSoundsTable from './CustomSoundsTable';

export default {
	component: CustomSoundsTable,
	decorators: [
		(fn) => (
			<PageContent mb='neg-x8'>
				<Margins block={8}>{fn()}</Margins>
			</PageContent>
		),
	],
} satisfies Meta<typeof CustomSoundsTable>;

const Template: StoryFn<typeof CustomSoundsTable> = (args) => {
	const reloadRef = useRef(() => undefined);
	return <CustomSoundsTable {...args} reload={reloadRef} />;
};

export const Default = Template.bind({});
Default.args = {
	onClick: () => action('clicked'),
};
