import { Box, Icon } from '@rocket.chat/fuselage';

import SampleScene from './SampleScene';

const NoEffectThumbnail = () => (
	<SampleScene>
		<Box display='flex' padding={4} borderRadius='full' backgroundColor='overlay' color='pure-white'>
			<Icon name='ban' size='x20' />
		</Box>
	</SampleScene>
);

export default NoEffectThumbnail;
