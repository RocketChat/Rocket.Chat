import { Sidebar, Dropdown, OptionDivider } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React, { VFC, useRef, HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';

import { useDropdownVisibility } from '../../../../sidebar/header/hooks/useDropdownVisibility';
import MarkReadList from './MarkReadList';
import SortModeList from './SortModeList';

const DropdownMenu: VFC<Omit<HTMLAttributes<HTMLElement>, 'is'>> = (props) => {
	const reference = useRef(null);
	const target = useRef(null);
	const { isVisible, toggle } = useDropdownVisibility({ reference, target });

	const isMobile = useMediaQuery('(max-width: 767px)');

	return (
		<>
			<Sidebar.TopBar.Action {...props} icon='sort' onClick={(): void => toggle()} ref={reference} />
			{isVisible &&
				createPortal(
					<Dropdown reference={reference} ref={target}>
						<>
							{isMobile && (
								<>
									<MarkReadList />
									<OptionDivider />
								</>
							)}
							<SortModeList />
						</>
					</Dropdown>,
					document.body,
				)}
		</>
	);
};

export default DropdownMenu;
