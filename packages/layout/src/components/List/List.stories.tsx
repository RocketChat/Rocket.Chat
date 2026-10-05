import type { Meta, StoryFn } from '@storybook/react-webpack5';

import List from './List';
import ListItem from './ListItem';

export default {
	title: 'components/List',
	component: List,
} satisfies Meta<typeof List>;

export const Default: StoryFn<typeof List> = () => (
	<List>
		<ListItem fontScale='h4'>List Item 1</ListItem>
		<ListItem fontScale='h4'>List Item 2</ListItem>
	</List>
);
