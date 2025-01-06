import { usePermission, useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import ModerationConsolePage from './ModerationConsolePage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const MODERATION_VALID_TABS = ['users', 'messages'] as const;

const isValidTab = (tab: string | undefined): tab is (typeof MODERATION_VALID_TABS)[number] => MODERATION_VALID_TABS.includes(tab as any);

const ModerationRoute = () => {
	const canViewModerationConsole = usePermission('view-moderation-console');
	const router = useRouter();
	const tab = useRouteParameter('tab');

	useEffect(() => {
		if (!isValidTab(tab)) {
			router.navigate(
				{
					pattern: '/admin/moderation/:tab?/:context?/:id?',
					params: { tab: 'messages' },
				},
				{ replace: true },
			);
		}
	}, [tab, router]);

	if (!canViewModerationConsole) {
		return <NotAuthorizedPage />;
	}

	const onSelectTab = (tab: (typeof MODERATION_VALID_TABS)[number]) => {
		router.navigate(
			{
				pattern: '/admin/moderation/:tab?/:context?/:id?',
				params: { tab },
			},
			{ replace: true },
		);
	};

	return <ModerationConsolePage tab={tab as (typeof MODERATION_VALID_TABS)[number]} onSelectTab={onSelectTab} />;
};

export default ModerationRoute;
