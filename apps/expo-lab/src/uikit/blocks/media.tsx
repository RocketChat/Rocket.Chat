import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import * as UiKit from '@rocket.chat/ui-kit';

import { isRemoteImage } from './elements';
import type { BlockProps } from './layout';

// Same cap as maxImageHeight in fuselage-ui-kit/src/blocks/ImageBlock.tsx
const maxImageHeight = 360;

// Mirrors ImageBlock.tsx; the web preloads with document.createElement('img'), here Image reports its size on load
export function ImageBlock({ block, renderer }: BlockProps<UiKit.ImageBlock>) {
	const [size, setSize] = useState<{ width: number; height: number }>();
	const [failed, setFailed] = useState(false);
	if (!isRemoteImage(block.imageUrl)) return null;

	return (
		<View style={{ alignItems: 'flex-start', width: '100%' }}>
			{block.title ? <View style={{ marginBottom: 4 }}>{renderer.renderTextObject(block.title, 0, UiKit.BlockContext.CONTEXT)}</View> : null}
			{failed ? (
				<Text style={{ fontSize: 12, color: '#6c727a' }}>{block.altText}</Text>
			) : (
				<Image
					source={{ uri: block.imageUrl }}
					accessibilityLabel={block.altText}
					resizeMode='contain'
					onLoad={(e) => {
						const { width, height } = e.nativeEvent.source;
						if (width > 0 && height > 0) setSize({ width, height });
					}}
					onError={() => setFailed(true)}
					style={{ width: size?.width ?? '100%', maxWidth: '100%', aspectRatio: size ? size.width / size.height : 21 / 9, maxHeight: maxImageHeight, borderRadius: 4 }}
				/>
			)}
		</View>
	);
}
