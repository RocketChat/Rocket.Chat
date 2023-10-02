import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { CardFooter } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useExternalLink } from '../../../../hooks/useExternalLink';

// TODO: IMPLEMENT CHECKOUT ENDPOINT
const UPGRADE_LINK = 'https://go.rocket.chat/i/contact-sales';

type CardUpgradeButtonProps = {
	i18nKey?: string;
};

const CardUpgradeButton = ({ i18nKey = 'Upgrade' }: CardUpgradeButtonProps): ReactElement => {
	const { t } = useTranslation();
	const handleExternalLink = useExternalLink();

	return (
		<CardFooter>
			<ButtonGroup align='end'>
				<Button small onClick={() => handleExternalLink(UPGRADE_LINK)}>
					{t(i18nKey)}
				</Button>
			</ButtonGroup>
		</CardFooter>
	);
};

export default memo(CardUpgradeButton);
