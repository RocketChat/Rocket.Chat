import type { Keys } from '@rocket.chat/icons';
import nameToCharacterMapping from '@rocket.chat/icons';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Box } from '../Box';
import { Divider } from '../Divider';
import { InputBox } from '../InputBox';
import Icon from './Icon';
import { iconSizes } from './Icon.contract';

export default {
	title: 'Data Display/Icon',
	component: Icon,
	argTypes: {
		name: {
			control: 'text',
			description: 'Name of the icon to render, matching a key from the Fuselage icon set.',
			table: { category: 'Content' },
		},
		size: {
			control: 'select',
			options: iconSizes.map((pixels) => `x${pixels}`),
			description:
				'A step of the icon scale, by its name (`x16`) or its pixels (`16`); without it, the icon takes the size of the text around it.',
			table: { category: 'Size' },
		},
		color: {
			control: 'text',
			description:
				'A semantic text or status font token (`info`, `danger`, `status-font-on-warning`…); without it, the icon takes the colour of the text around it.',
			table: { category: 'Kind' },
		},
	},
} satisfies Meta<typeof Icon>;

type Story = StoryObj<typeof Icon>;

const iconsList = Object.keys(nameToCharacterMapping).sort((a, b) => a.localeCompare(b)) as Keys[];

export const Default: Story = {
	render: () => (
		<Box color='default'>
			{iconsList.map((name) => (
				<Icon key={name} name={name} size='x40' />
			))}
		</Box>
	),
};

export const Colors: Story = {
	render: () => (
		<Box display='flex' flexDirection='column' gap={8} color='default' fontScale='p2'>
			{(['default', 'hint', 'info', 'danger', 'status-font-on-success', 'status-font-on-warning', 'status-font-on-danger'] as const).map(
				(color) => (
					<Box key={color} display='flex' alignItems='center' gap={4}>
						<Icon name='bell' size='x20' color={color} />
						{color}
					</Box>
				),
			)}
		</Box>
	),
};

export const Sizes: Story = {
	render: () => (
		<Box display='flex' alignItems='center' gap='x8' color='default'>
			{iconSizes.map((pixels) => (
				<Icon key={pixels} name='bell' size={pixels} />
			))}
		</Box>
	),
};

export const Directional: Story = {
	render: () => (
		<Box display='flex' flexDirection='column' gap='x8' color='default'>
			{(['ltr', 'rtl'] as const).map((dir) => (
				<div key={dir} dir={dir}>
					<Icon name='arrow-back' size='x20' />
					<Icon name='chevron-left' size='x20' />
					<Icon name='send' size='x20' />
					<Icon name='bell' size='x20' />
				</div>
			))}
		</Box>
	),
};

export const AvailableIcons: Story = {
	render: () => {
		const [filter, setFilter] = useState('');

		const filteredIcons = iconsList.filter((name) => name.toLowerCase().includes(filter.toLowerCase()));
		return (
			<>
				<Box display='flex' flexDirection='column'>
					<Box maxWidth='x200'>
						<InputBox
							type='text'
							value={filter}
							onChange={(e) => setFilter((e.target as HTMLInputElement).value)}
							placeholder='Search icons'
							endAddon={<Icon name='magnifier' size='x20' />}
						/>
					</Box>
				</Box>
				<Divider />
				<Box display='flex' flexWrap='wrap' alignContent='flex-start' textAlign='center' height='90vh' overflow='auto'>
					{filteredIcons.map((name, index) => (
						<Box key={index} marginBlock='x32' marginInline='x8' flexShrink={0} flexGrow={0} flexBasis='128px'>
							<Box>
								<Icon name={name} size='x40' color='default' />
							</Box>
							<Box color='hint'>{name}</Box>
						</Box>
					))}
				</Box>
			</>
		);
	},
};
