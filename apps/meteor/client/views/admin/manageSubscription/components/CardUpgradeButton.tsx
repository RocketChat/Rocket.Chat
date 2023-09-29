import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { CardFooter } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useExternalLink } from '../../../../hooks/useExternalLink';

const UPGRADE_LINK = 'https://go.rocket.chat/i/upgrade';

const CardUpgradeButton = (): ReactElement => {
	const t = useTranslation();
	const handleExternalLink = useExternalLink();

	return (
		<CardFooter>
			<ButtonGroup align='end'>
				<Button small onClick={() => handleExternalLink(UPGRADE_LINK)}>
					{t('Upgrade')}
				</Button>
			</ButtonGroup>
		</CardFooter>
	);
};

export default CardUpgradeButton;
