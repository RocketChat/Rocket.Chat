import { Stack } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type CardWidgetContainerProps = {
	children: ReactNode;
};

const CardWidgetContainer = ({ children }: CardWidgetContainerProps) => {
	return <Stack gap='x8'>{children}</Stack>;
};

export default CardWidgetContainer;
