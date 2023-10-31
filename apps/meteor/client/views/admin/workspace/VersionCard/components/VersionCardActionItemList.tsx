import React from 'react';

import type { VersionActionItem } from './VersionCardActionItem';
import VersionCardActionItem from './VersionCardActionItem';

type VersionCardActionItemListProps = {
	actionItems: VersionActionItem[];
};

const VersionCardActionItemList = ({ actionItems }: VersionCardActionItemListProps) => {
	return (
		<>
			{actionItems.map((item, index) => (
				<VersionCardActionItem key={index} actionItem={item} />
			))}
		</>
	);
};

export default VersionCardActionItemList;
