import { Box } from '@rocket.chat/fuselage';
import { Fragment } from 'react';

import Items from './Items';
import type { Item, ItemBranch } from './types';

type DropDownProps = {
	readonly blocksTree: Item;
};

const DropDown = ({ blocksTree }: DropDownProps) => {
	const layer = 1;

	const recursiveComponentTree = (branch: ItemBranch, layer: number) => (
		<Items layer={layer} label={branch.label} payload={branch.payload}>
			{branch.branches?.map((branch: ItemBranch, index: number) => (
				<Fragment key={index}>{recursiveComponentTree(branch, layer + 1)}</Fragment>
			))}
		</Items>
	);

	return (
		<Box pbs='15px' pbe='30px'>
			{blocksTree.map((branch: ItemBranch, i: number) => (
				<Box key={i}>{recursiveComponentTree(branch, layer)}</Box>
			))}
		</Box>
	);
};

export default DropDown;
