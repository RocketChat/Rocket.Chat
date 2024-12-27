import { css } from '@rocket.chat/css-in-js';
import { Palette, Box } from '@rocket.chat/fuselage';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { Resizable } from 're-resizable';
import type { ComponentProps } from 'react';

type ContextualbarResizableProps = { defaultWidth: string } & ComponentProps<typeof Resizable>;

const ContextualbarResizable = ({ defaultWidth, children, ...props }: ContextualbarResizableProps) => {
	const [contextualbarWidth, setContextualbarWidth] = useLocalStorage('contextualbarWidth', defaultWidth);
	const [expanded] = useLocalStorage('expand-threads', false);

	const handleStyle = css`
		height: 100%;
		&:hover {
			background-color: ${Palette.stroke['stroke-highlight']};
		}
	`;

	return (
		<Resizable
			{...props}
			onResize={(_e, _dir, elRef) => {
				setContextualbarWidth(elRef.style.width);
			}}
			defaultSize={{
				width: contextualbarWidth,
				height: '100%',
			}}
			minWidth={defaultWidth}
			maxWidth='50%'
			minHeight='100%'
			handleStyles={{ left: { width: '3px', zIndex: expanded ? 5 : 99, left: 0 } }}
			handleComponent={{ left: <Box className={handleStyle} /> }}
		>
			{children}
		</Resizable>
	);
};

export default ContextualbarResizable;
