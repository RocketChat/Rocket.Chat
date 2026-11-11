import { Button, Throbber, type ButtonProps } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { MouseEventHandler } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

export type ButtonElementProps = BlockProps<UiKit.ButtonElement>;

const getVariant = (style: UiKit.ButtonElement['style'], secondary: boolean | undefined): ButtonProps['variant'] => {
	if (style === 'primary') {
		return 'primary';
	}

	if (style === 'success' || style === 'warning' || style === 'danger') {
		return secondary ? `secondary-${style}` : style;
	}

	return secondary ? 'secondary' : undefined;
};

const ButtonElement = ({ block, context, surfaceRenderer }: ButtonElementProps) => {
	const [{ loading }, action] = useUiKitState(block, context);
	const { style, url, text, value, secondary } = block;
	const variant = getVariant(style, secondary);

	const handleClick: MouseEventHandler = (e) => {
		void action({ target: e.currentTarget });
	};

	if (url && UiKit.isSafeUrl(url)) {
		return (
			<Button
				is='a'
				target='_blank'
				size='small'
				compact
				aria-label={block.accessibility_label}
				disabled={loading}
				href={url}
				variant={variant}
				onClick={handleClick}
			>
				{loading ? <Throbber /> : surfaceRenderer.renderTextObject(text, 0, UiKit.BlockContext.NONE)}
			</Button>
		);
	}

	return (
		<Button
			size='small'
			compact
			aria-label={block.accessibility_label}
			disabled={loading}
			variant={variant}
			value={value}
			onClick={handleClick}
		>
			{loading ? <Throbber /> : surfaceRenderer.renderTextObject(text, 0, UiKit.BlockContext.NONE)}
		</Button>
	);
};

export default ButtonElement;
