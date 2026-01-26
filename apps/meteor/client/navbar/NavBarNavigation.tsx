import { css } from '@rocket.chat/css-in-js';
import { NavBarGroup, NavBarItem, Box } from '@rocket.chat/fuselage';
import { useLayout, useRouter } from '@rocket.chat/ui-contexts';
import { FocusScope } from 'react-aria';
import { useTranslation } from 'react-i18next';

import NavBarSearch from './NavBarSearch';

const NavbarNavigation = () => {
	const { t } = useTranslation();
	const { navigate } = useRouter();
	const { isMobile } = useLayout();

	const navigationArrowStyle = css`
		border-radius: 0.25rem;
		transition: background-color 0.15s ease-in-out;

		&:hover {
			background-color: var(--rcx-color-surface-hover);
		}

		&:focus-visible {
			outline: none;
			box-shadow: 0 0 0 2px var(--rcx-color-stroke-focus);
			background-color: var(--rcx-color-surface-hover);
		}
	`;

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
							onClick={() => navigate(-1)}
							icon='chevron-right'
							small
							className={navigationArrowStyle}
						/>
						<NavBarItem
							title={t('Forward_in_history')}
							onClick={() => navigate(1)}
							icon='chevron-left'
							small
							className={navigationArrowStyle}
						/>
					</NavBarGroup>
				</Box>
			)}
		</Box>
	);
};

export default NavbarNavigation;
