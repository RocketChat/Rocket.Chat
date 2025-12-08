import { IconButton } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { MouseEventHandler, ReactElement } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type IconButtonElementProps = BlockProps<UiKit.IconButtonElement>;

const IconButtonElement = ({ block, context }: IconButtonElementProps): ReactElement => {
	const [{ loading }, action] = useUiKitState(block, context);

	const { url, value, label, icon } = block;
	const { icon: iconName, variant } = icon;

	const handleClick: MouseEventHandler = (e) => {
		action({ target: e.currentTarget });
	};

	if (url) {
		return <IconButton small is='a' target='_blank' disabled={loading} icon={iconName} href={url} onClick={handleClick} label={label} />;
	}

	return (
		<IconButton
			icon={iconName}
			color={variant === 'default' ? 'default' : 'danger'}
			small
			label={label}
			disabled={loading}
			value={value}
			onClick={handleClick}
		/>
	);
};

export default IconButtonElement;
