import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import BurgerBadge from './BurgerBadge';
import BurgerIcon from './BurgerIcon';

type BurgerMenuButtonProps = {
	open?: boolean;
	badge?: number | unknown;
	onClick: () => void;
};

const BurgerMenuButton = ({ open, badge, onClick }: BurgerMenuButtonProps): ReactElement => {
	const t = useTranslation();

	return (
		<Box
			is='button'
			data-qa-id='burger-menu'
			aria-label={open ? t('Close_menu') : t('Open_menu')}
			type='button'
			position='relative'
			marginInlineEnd='x8'
			className={css`
				cursor: pointer;
			`}
			onClick={onClick}
		>
			<BurgerIcon open={open} />
			{badge && <BurgerBadge>{badge}</BurgerBadge>}
		</Box>
	);
};

export default BurgerMenuButton;
