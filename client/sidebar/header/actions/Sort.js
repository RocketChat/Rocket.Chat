import { Box, Sidebar, Dropdown } from '@rocket.chat/fuselage';
import React, { useRef } from 'react';
import { createPortal } from 'react-dom';

import { popover } from '../../../../app/ui-utils/client';
import SortList from '../../../components/SortList';
import { useDropdownVisibility } from '../hooks/useDropdownVisibility';

const config = (e) => ({
	template: 'SortList',
	currentTarget: e.currentTarget,
	data: {
		options: [],
	},
	offsetVertical: e.currentTarget.clientHeight + 10,
});

const onClick = (e) => {
	popover.open(config(e));
};

const Sort = (props) => {
	const reference = useRef(null);
	const target = useRef(null);
	const { isVisible, toggle } = useDropdownVisibility({ reference, target });

	return (
		<>
			<Box ref={reference}>
				<Sidebar.TopBar.Action {...props} icon='sort' onClick={toggle} />
			</Box>
			{isVisible &&
				createPortal(
					<Dropdown reference={reference} ref={target}>
						<SortList />
					</Dropdown>,
					document.body,
				)}
		</>
	);
};

export default Sort;
