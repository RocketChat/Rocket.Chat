import { Box, Margins } from '@rocket.chat/fuselage';

const CardWidgetContainer = ({ children }: { children: React.ReactNode }) => {
	return (
		<Box marginBlock={-8}>
			<Margins block={8}>{children}</Margins>
		</Box>
	);
};

export default CardWidgetContainer;
