import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import VerticalBar from '../../../../../../client/components/VerticalBar';
import CannedResponseComponent from './CannedResponse';
import CannedResponseListComponent from './CannedResponseList';
import CannedItemComponent from './Item';

export default {
	title: 'omnichannel/CannedResponse/ContextualBar',
	component: CannedResponseListComponent,
};

const options = [
	['all', 'All'],
	['global', 'Public'],
	['user', 'Private'],
];

const cannedItems = [
	{
		shortcut: 'test',
		text: 'simple canned response test',
		scope: 'global',
		tags: ['sales', 'support'],
	},
	{
		shortcut: 'test2',
		text: 'simple canned response test2',
		scope: 'Customer Support',
	},
	{
		shortcut: 'test3 long long long long long long long long long',
		text: 'simple canned response test3 long long long long long long long long long long long long long long long longlong long long long long long longlong long long long long long longlong long long long long long longlong long long long long long longlong long long long long long longlong long long long long long long',
		scope: 'Customer Support long long long long long long long long long long',
		tags: ['sales', 'support', 'long', 'long', 'long', 'long', 'long', 'long', 'long', 'long'],
	},
];

export const CannedResponseList = () => (
	<Box h='600px'>
		<VerticalBar>
			<CannedResponseListComponent
				options={options}
				cannedItems={cannedItems}
				itemCount={cannedItems.length}
				loadMoreItems={() => {}}
				onClickItem={() => {
					console.log('item');
				}}
				onClickUse={(e) => {
					e.preventDefault();
					e.stopPropagation();

					console.log('use');
				}}
			/>
		</VerticalBar>
	</Box>
);

export const CannedItem = () => (
	<Box w='330px'>
		<CannedItemComponent data={cannedItems[0]} />
	</Box>
);

export const CannedResponse = () => (
	<Box h='600px' w='330px'>
		<CannedResponseComponent
			canEdit={true}
			data={cannedItems[2]}
			onClickBack={() => {
				console.log('back');
			}}
			onClickEdit={() => {
				console.log('edit');
			}}
			onClickUse={() => {
				console.log('use');
			}}
		/>
	</Box>
);
