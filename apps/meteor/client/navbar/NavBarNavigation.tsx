import { NavBarGroup, NavBarItem, Box } from '@rocket.chat/fuselage';
import { useLayout, useRouter } from '@rocket.chat/ui-contexts';
import { FocusScope } from 'react-aria';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import NavBarSearch from './NavBarSearch';

const NavbarNavigation = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const { isMobile } = useLayout();
	const [, setRouteTick] = useState(0);

	useEffect(() => {
		return router.subscribeToRouteChange(() => {
			setRouteTick((t) => t + 1);
		});
	}, [router]);

	const canGoBack = router.getCanGoBack();
	const canGoForward = router.getCanGoForward();

	return (
		<Box display='flex' flexGrow={1} justifyContent='center'>
			<FocusScope>
				<NavBarSearch />
			</FocusScope>
			{!isMobile && (
				<Box mie={8}>
					<NavBarGroup aria-label={t('History_navigation')}>
						<NavBarItem
							title={t('Back_in_history')}
							onClick={() => router.navigate(-1)}
							icon='chevron-right'
							small
							disabled={!canGoBack}
						/>
						<NavBarItem
							title={t('Forward_in_history')}
							onClick={() => router.navigate(1)}
							icon='chevron-left'
							small
							disabled={!canGoForward}
						/>
					</NavBarGroup>
				</Box>
			)}
		</Box>
	);
};

export default NavbarNavigation;
