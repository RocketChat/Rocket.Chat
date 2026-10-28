import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';

import { Box } from '../Box';
import { IconButton } from '../Button';
import { Option } from '../Option';
import Dropdown from './Dropdown';

export default {
	title: 'Navigation/Dropdown',
	component: Dropdown,
	argTypes: {
		reference: {
			control: false,
			description: 'Ref to the anchor element the dropdown is positioned against.',
			table: { category: 'Positioning' },
		},
		placement: {
			control: 'select',
			options: [
				'top',
				'left',
				'bottom',
				'right',
				'top-start',
				'top-middle',
				'top-end',
				'left-start',
				'left-middle',
				'left-end',
				'bottom-start',
				'bottom-middle',
				'bottom-end',
				'right-start',
				'right-middle',
				'right-end',
			],
			description: 'Position of the dropdown relative to the anchor. Defaults to `bottom-start`.',
			table: {
				category: 'Positioning',
				defaultValue: { summary: 'bottom-start' },
			},
		},
		children: {
			control: false,
			description: 'Dropdown items, typically `Option` elements.',
			table: { category: 'Content' },
		},
	},
} satisfies Meta<typeof Dropdown>;

type Story = StoryObj<typeof Dropdown>;

export const Default: Story = {
	render: () => {
		const anchor = useRef<HTMLElement>(null);
		const target = useRef<HTMLElement>(null);

		const list = Array.from(new Array(20));

		return (
			<Box width='400px' height='500px' display='flex' justifyContent='center' alignItems='center'>
				<IconButton variant='secondary' size='small' ref={anchor} icon='doner' data-testid='dropdown-anchor' />
				<Dropdown ref={target} reference={anchor} placement='bottom-end'>
					{list.map((_, i) => (
						<Option key={i}>Example {i + 1}</Option>
					))}
				</Dropdown>
			</Box>
		);
	},
};
