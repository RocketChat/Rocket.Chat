import type { RouteName, RouteParameters } from '@rocket.chat/ui-contexts';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { Suspense, useCallback } from 'react';

import type { PageModalSession } from './PageModal';
import PageModal from './PageModal';
import PageSkeleton from '../../../components/PageSkeleton';

type OpenPageModalOptions = {
	routeName: RouteName;
	pattern: string;
	params: RouteParameters;
	label: string;
	page: ReactNode;
	sidebar?: ReactNode;
};

/** Opens a page in a modal, at the given route params, as if the user had navigated there. */
export const useOpenPageModal = () => {
	const setModal = useSetModal();

	return useCallback(
		({ routeName, pattern, params, label, page, sidebar }: OpenPageModalOptions) => {
			const session: PageModalSession = { location: { current: { params, search: {} } }, dialogs: 0 };
			const close = () => setModal(null);

			setModal(
				<PageModal routeName={routeName} pattern={pattern} session={session} aria-label={label} sidebar={sidebar} onClose={close}>
					<Suspense fallback={<PageSkeleton />}>{page}</Suspense>
				</PageModal>,
			);
		},
		[setModal],
	);
};
