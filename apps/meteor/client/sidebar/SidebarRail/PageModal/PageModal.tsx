import { Box, Modal } from '@rocket.chat/fuselage';
import { modalStore, PageCloseContext } from '@rocket.chat/ui-client';
import type { LocationPathname, ModalContextValue, RouteName } from '@rocket.chat/ui-contexts';
import { ModalContext, RouterContext } from '@rocket.chat/ui-contexts';
import type { MouseEvent, ReactNode } from 'react';
import { useContext, useMemo } from 'react';

import type { ModalLocation } from './useModalRouter';
import { matchPattern, useModalRouter } from './useModalRouter';

/** What a page modal keeps while a dialog opened from it is on top, since only the top modal is rendered. */
export type PageModalSession = {
	location: { current: ModalLocation };
	/** How many dialogs the page has stacked on top of its modal. */
	dialogs: number;
};

type PageModalProps = {
	'routeName': RouteName;
	'pattern': string;
	'session': PageModalSession;
	'aria-label': string;
	/** Navigation shown beside the page, as the page's own sidebar would be. */
	'sidebar'?: ReactNode;
	'onClose': () => void;
	'children': ReactNode;
};

/**
 * Shows a full page, such as the Directory, in a large modal opened from the sidebar rail. Being a dialog over the
 * current page, it doesn't change which rail item is active: the Inbox or Teams item stays the only one.
 *
 * The page gets a close button in its header, and the dialogs it opens (an app's install review, for instance) stack
 * on top of the modal instead of replacing it, so closing them brings the page back where it was. Links to the page's
 * own route, like those of its sidebar, stay in the modal too.
 */
const PageModal = ({ routeName, pattern, session, sidebar, onClose, children, ...props }: PageModalProps) => {
	const modalRouter = useModalRouter({ routeName, pattern, location: session.location, onClose });
	const modalContext = useContext(ModalContext);

	const stackedModalContext = useMemo<ModalContextValue | undefined>(() => {
		if (!modalContext) {
			return undefined;
		}

		const closeDialogs = () => {
			for (; session.dialogs > 0; session.dialogs--) {
				modalStore.close();
			}
		};

		return {
			...modalContext,
			modal: {
				setModal: (modal?: ReactNode) => {
					closeDialogs();

					if (modal) {
						modalStore.push(modal, modalContext.region);
						session.dialogs++;
					}
				},
			},
		};
	}, [modalContext, session]);

	// The app's router follows any link click it gets, which would leave the modal; it skips the ones handled here.
	const handleLinkClick = (event: MouseEvent) => {
		const link = (event.target as Element).closest('a');

		if (!link?.href || link.target || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return;
		}

		const url = new URL(link.href);

		if (url.origin !== window.location.origin || !matchPattern(pattern, url.pathname)) {
			return;
		}

		event.preventDefault();
		modalRouter.navigate(url.pathname as LocationPathname);
	};

	return (
		<Modal aria-label={props['aria-label']} maxWidth='x1280' height='full' maxHeight='x800'>
			<Box display='flex' flexGrow={1} minHeight={0} overflow='hidden' borderRadius='large' onClick={handleLinkClick}>
				<ModalContext.Provider value={stackedModalContext}>
					<RouterContext.Provider value={modalRouter}>
						{sidebar && (
							<Box
								display='flex'
								flexDirection='column'
								flexShrink={0}
								width='x240'
								backgroundColor='surface-sidebar'
								borderInlineEndWidth='default'
								borderInlineEndColor='stroke-light'
							>
								{sidebar}
							</Box>
						)}
						<Box display='flex' flexDirection='column' flexGrow={1} minWidth={0}>
							<PageCloseContext.Provider value={onClose}>{children}</PageCloseContext.Provider>
						</Box>
					</RouterContext.Provider>
				</ModalContext.Provider>
			</Box>
		</Modal>
	);
};

export default PageModal;
