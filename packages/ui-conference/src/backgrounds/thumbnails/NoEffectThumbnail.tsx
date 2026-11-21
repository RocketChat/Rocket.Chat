import { Icon } from '@rocket.chat/fuselage';

import SampleScene from './SampleScene';

const NoEffectThumbnail = () => (
	<>
		<SampleScene />
		<Icon name='ban' size='x20' style={{ position: 'relative', color: 'white', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.6))' }} />
	</>
);

export default NoEffectThumbnail;
