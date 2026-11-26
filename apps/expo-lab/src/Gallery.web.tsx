import '@rocket.chat/fuselage/dist/fuselage.css';
import '@rocket.chat/icons/dist/rocketchat.css';
import { PaletteStyleTag } from '@rocket.chat/fuselage';

import { Content } from './GalleryContent';

// Web reference for the native gallery: the published build, its stylesheet and the light palette the app owns
export function Gallery({ onBack }: { onBack: () => void }) {
	return (
		<div style={{ width: 393, padding: 16, boxSizing: 'border-box' }} onDoubleClick={onBack}>
			<PaletteStyleTag theme='light' />
			<Content />
		</div>
	);
}
