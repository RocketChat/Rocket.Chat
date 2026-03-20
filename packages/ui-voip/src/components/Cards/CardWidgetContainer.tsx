import { Box, Margins } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type CardWidgetContainerProps = {
	children: ReactNode;
};

const CardWidgetContainer = ({ children }: CardWidgetContainerProps) => {
	return (
		<Box marginBlock={-8}>
			<Margins block={8}>{children}</Margins>
		</Box>
	);
};

export default CardWidgetContainer;
