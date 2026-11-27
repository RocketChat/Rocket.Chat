import { ScrollView } from 'react-native';

import { FuselageHost } from './FuselageHost';
import { Content } from './GalleryContent';

export function Gallery({ onBack }: { onBack: () => void }) {
	return (
		<FuselageHost title='gallery' onBack={onBack}>
			<ScrollView style={{ flex: 1 }} contentInsetAdjustmentBehavior='never'>
				<Content />
			</ScrollView>
		</FuselageHost>
	);
}
