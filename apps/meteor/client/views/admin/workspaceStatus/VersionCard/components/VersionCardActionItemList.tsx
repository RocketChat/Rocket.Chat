import React from 'react';

import type { ActionItem } from './VersionCardActionItem';
import VersionCardActionItem from './VersionCardActionItem';

type VersionCardActionItemListProps = {
	actionItems: ActionItem[];
};

const VersionCardActionItemList = ({ actionItems }: VersionCardActionItemListProps) => {
	return actionItems ? (
		<>
			{actionItems.map((item, index) => (
				<VersionCardActionItem key={index} actionItem={item} />
			))}
		</>
	) : null;
};

export default VersionCardActionItemList;
