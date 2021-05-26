import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import CannedResponsesPage from './CannedResponsesPage';

export default {
	title: 'omnichannel/CannedResponse/CannedResponsesPage',
	component: CannedResponsesPage,
};

const cannedResponses = [
	{
		shortcut: 'lorem',
		shared: ['Public'],
		createdBy: 'userId',
		createdAt: new Date(),
		tags: ['lala'],
	},
	{
		shortcut: 'mussum',
		shared: ['Sales'],
		createdBy: 'userId',
		createdAt: new Date(),
		tags: ['lele', 'Facebook', 'I like tags'],
	},
	{
		shortcut: 'turtles',
		shared: ['Sales', 'Turtles Team'],
		createdBy: 'userId',
		createdAt: new Date(),
		tags: ['Gold', 'Turtles', 'I like Turtles'],
	},
];

export const Default = () => (
	<Box maxWidth='x300' alignSelf='center' w='full'>
		<CannedResponsesPage responses={cannedResponses} />
	</Box>
);
