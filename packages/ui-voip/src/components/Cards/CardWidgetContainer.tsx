import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type CardWidgetContainerProps = {
	children: ReactNode;
};

// `.rcx-box` outranks a card's own `margin`, so cards are spaced like the other children
const childrenSpacing = css`
	& > .rcx-box {
		margin-block: 8px;
	}
`;

const CardWidgetContainer = ({ children }: CardWidgetContainerProps) => {
	return (
		<Box marginBlock={-8} className={childrenSpacing}>
			{children}
		</Box>
	);
};

export default CardWidgetContainer;
