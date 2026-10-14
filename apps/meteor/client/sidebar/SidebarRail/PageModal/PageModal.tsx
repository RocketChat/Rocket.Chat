import { Box, Modal } from '@rocket.chat/fuselage';
import type { RouteName, RouteParameters } from '@rocket.chat/ui-contexts';
import { RouterContext } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

import { useModalRouter } from './useModalRouter';

type PageModalProps = {
	'routeName': RouteName;
	'pattern': string;
	'initialParams': RouteParameters;
	'aria-label': string;
	'onClose': () => void;
	'children': ReactNode;
};

/**
 * Shows a full page, such as the Directory, in a large modal opened from the sidebar rail. Being a dialog over the
 * current page, it doesn't change which rail item is active: the Inbox or Teams item stays the only one.
 */
const PageModal = ({ routeName, pattern, initialParams, onClose, children, ...props }: PageModalProps) => {
	const modalRouter = useModalRouter({ routeName, pattern, initialParams, onClose });

	return (
		<Modal aria-label={props['aria-label']} maxWidth='x1280' height='full' maxHeight='x800'>
			<Box display='flex' flexDirection='column' flexGrow={1} minHeight={0} overflow='hidden' borderRadius='large'>
				<RouterContext.Provider value={modalRouter}>{children}</RouterContext.Provider>
			</Box>
		</Modal>
	);
};

export default PageModal;
