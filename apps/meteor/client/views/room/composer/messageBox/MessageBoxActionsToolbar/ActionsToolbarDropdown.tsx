import { Dropdown, IconButton } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import React, { useRef } from 'react';

import { useDropdownVisibility } from '../../../../../sidebar/header/hooks/useDropdownVisibility';

type ActionsToolbarDropdownProps = {
	disabled?: boolean;
	children: () => ReactNode[];
};

const ActionsToolbarDropdown = ({ children, ...props }: ActionsToolbarDropdownProps) => {
	const reference = useRef(null);
	const target = useRef(null);

	const { isVisible, toggle } = useDropdownVisibility({ reference, target });

	return (
		<>
			<IconButton data-qa-id='menu-more-actions' small ref={reference} icon='plus' onClick={() => toggle()} {...props} />
			{isVisible && (
				<Dropdown reference={reference} ref={target} placement='bottom-start'>
					{children()}
				</Dropdown>
			)}
		</>
	);
};

export default ActionsToolbarDropdown;
