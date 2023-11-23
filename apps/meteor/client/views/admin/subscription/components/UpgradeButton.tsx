import { Button, ButtonGroup, Throbber } from '@rocket.chat/fuselage';
import type { ButtonProps } from '@rocket.chat/fuselage/dist/components/Button/Button';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { useCheckoutUrlAction } from '../hooks/useCheckoutUrl';

const UpgradeButton = ({
	children,
	target = '_blank',
	action,
	...props
}: Partial<ButtonProps> & {
	target: string;
	action: string;
}): ReactElement => {
	const mutation = useCheckoutUrlAction();

	const handleBtnClick = () => {
		if (mutation.isLoading) {
			return;
		}

		mutation.mutate({
			target,
			action,
		});
	};

	return (
		<ButtonGroup align='end'>
			<Button onClick={() => handleBtnClick()} {...props} disabled={mutation.isLoading}>
				{mutation.isLoading ? <Throbber inheritColor size='x12' /> : children}
			</Button>
		</ButtonGroup>
	);
};

export default memo(UpgradeButton);
