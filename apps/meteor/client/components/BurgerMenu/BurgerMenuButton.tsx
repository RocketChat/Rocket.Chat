import { Box, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import BurgerBadge from './BurgerBadge';

type BurgerMenuButtonProps = {
	badge?: number | unknown;
	onClick: () => void;
};

const BurgerMenuButton = ({ badge, onClick }: BurgerMenuButtonProps): ReactElement => {
	const t = useTranslation();

	return (
		<Box position='relative'>
			<IconButton icon='burger-menu' small data-qa-id='burger-menu' aria-label={t('Open_sidebar')} marginInlineEnd={8} onClick={onClick} />
			{badge && <BurgerBadge>{badge}</BurgerBadge>}
		</Box>
	);
};

export default BurgerMenuButton;
