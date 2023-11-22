import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import type { ButtonProps } from '@rocket.chat/fuselage/dist/components/Button/Button';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { useCheckoutUrl } from '../hooks/useCheckoutUrl';

const UpgradeButton = ({
	children,
	target = '_blank',
	action,
	...props
}: Partial<ButtonProps> & {
	target: string;
	action: string;
}): ReactElement => {
	const url = useCheckoutUrl()({ target, action });

	return (
		<ButtonGroup align='end'>
			<Button is='a' href={url} target='_blank' rel='noopener noreferrer' {...props}>
				{children}
			</Button>
		</ButtonGroup>
	);
};

export default memo(UpgradeButton);
