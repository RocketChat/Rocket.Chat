import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';

export const ExternalFrameContainer = () => {
	const frameUrl = useSetting('Omnichannel_External_Frame_URL', '') as string;

	if (!frameUrl) {
		return null;
	}

	return (
		<Box width='100%' height='100%' display='flex' flexGrow={1}>
			<Box is='iframe' src={frameUrl} width='100%' height='100%' border='none' title='Omnichannel External Frame' />
		</Box>
	);
};
