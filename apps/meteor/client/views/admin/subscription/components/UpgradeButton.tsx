import { Button, ButtonGroup, Throbber } from '@rocket.chat/fuselage';
import type { ButtonProps } from '@rocket.chat/fuselage/dist/components/Button/Button';
import type { ReactElement } from 'react';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useCheckoutUrlAction } from '../hooks/useCheckoutUrl';

type UpgradeButtonProps = {
	i18nKey?: string;
} & Partial<ButtonProps>;

const UpgradeButton = ({ i18nKey = 'Manage_subscription', ...props }: UpgradeButtonProps): ReactElement => {
	const { t } = useTranslation();
	const mutation = useCheckoutUrlAction();

	const handleBtnClick = () => {
		if (mutation.isLoading) {
			return;
		}

		mutation.mutate();
	};

	return (
		<ButtonGroup align='end'>
			<Button onClick={() => handleBtnClick()} {...props} disabled={mutation.isLoading}>
				{mutation.isLoading ? <Throbber inheritColor size='x12' /> : t(i18nKey)}
			</Button>
		</ButtonGroup>
	);
};

export default memo(UpgradeButton);
