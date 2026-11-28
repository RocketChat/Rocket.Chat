import { Item, ItemContent, ItemDescription, ItemLink, ItemTitle } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';

import ListRow from './ListRow';
import NavigableList from './NavigableList';

const rows = ['General', 'Design', 'Engineering'];

const meta = {
	component: NavigableList,
	args: {
		'aria-label': 'Channels',
		'children': rows.map((name) => (
			<ListRow key={name} aria-label={name}>
				<Item inset='lg'>
					<ItemContent>
						<ItemTitle>
							<ItemLink href='#'>{name}</ItemLink>
						</ItemTitle>
						<ItemDescription>The up and down arrows move between the rows</ItemDescription>
					</ItemContent>
				</Item>
			</ListRow>
		)),
	},
} satisfies Meta<typeof NavigableList>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
