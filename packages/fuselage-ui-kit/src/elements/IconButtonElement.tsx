import { IconButton } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { MouseEventHandler, ReactElement } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type IconButtonElementProps = BlockProps<UiKit.IconButtonElement>;

const IconButtonElement = ({ block, context }: IconButtonElementProps): ReactElement => {
	const [{ loading }, action] = useUiKitState(block, context);

	const handleClick: MouseEventHandler = (e) => {
		action({ target: e.currentTarget });
	};

	if (loading) {
		return <></>;
		// return <Throbber />;
	}

	return (
		<IconButton
			icon={block.icon.icon}
			color={block.icon.variant === 'default' ? 'default' : 'danger'}
			label={block.label}
			// url={block.url}
			value={block.value}
			onClick={handleClick}
		/>
	);
};

export default IconButtonElement;
