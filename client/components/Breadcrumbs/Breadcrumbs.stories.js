import React from 'react';

import Breadcrumbs from '.';

export default {
	title: 'components/Breadcrumbs',
	component: Breadcrumbs,
};

const { Item, Icon, Text, Link, Separator } = Breadcrumbs;

export const Default = () =>
	<Breadcrumbs>
		<Item>
			<Icon name='lock' />
			<Text>design</Text>
		</Item>
		<Separator/>
		<Item>
			<Icon name='lock' />
			<Text>rc-design</Text>
		</Item>
	</Breadcrumbs>;

export const AsTeamMember = () =>
	<Breadcrumbs>
		<Item>
			<Icon name='lock' />
			<Link>design</Link>
		</Item>
		<Separator/>
		<Item>
			<Icon name='lock' />
			<Text>rc-design</Text>
		</Item>
	</Breadcrumbs>;

export const WithDiscussion = () =>
	<Breadcrumbs>
		<Item>
			<Icon name='lock' />
			<Text>design</Text>
		</Item>
		<Separator/>
		<Item>
			<Icon name='lock' />
			<Text>rc-design</Text>
		</Item>
		<Separator/>
		<Item>
			<Icon name='baloons' />
			<Text>storybook</Text>
		</Item>
	</Breadcrumbs>;
