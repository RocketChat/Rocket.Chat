import { Button } from '@rocket.chat/fuselage';
import type { ButtonProps } from '@rocket.chat/fuselage/dist/components/Button/Button';
import type { ReactElement } from 'react';
import { memo } from 'react';

import { useExternalLink } from '../../../../hooks/useExternalLink';
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
	const handleOpenLink = useExternalLink();
	const url = useCheckoutUrl()({ target, action });

	return (
		<Button icon='new-window' onClick={() => handleOpenLink(url)} {...props}>
			{children}
		</Button>
	);
};

export default memo(UpgradeButton);
