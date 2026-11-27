import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as UiKit from '@rocket.chat/ui-kit';

import type { BlockProps } from './layout';

const collapsedCount = 5;

// Mirrors ActionsBlock.tsx and ActionsBlock.Action.tsx: wrapping row, "Show more..." after five elements
export function ActionsBlock({ block, renderer }: BlockProps<UiKit.ActionsBlock>) {
	const [collapsed, setCollapsed] = useState(() => Array.isArray(block.elements) && block.elements.length > collapsedCount);
	if (!Array.isArray(block.elements)) return null;

	const elements = (collapsed ? block.elements.slice(0, collapsedCount) : block.elements).map((element) =>
		typeof element === 'object' && element !== null ? { ...element, appId: element.appId ?? block.appId, blockId: element.blockId ?? block.blockId } : element,
	);

	return (
		<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
			{elements.map((element, i) => (
				<View key={i}>{renderer.renderActionsBlockElement(element, i)}</View>
			))}
			{collapsed && (
				<Pressable accessibilityRole='button' onPress={() => setCollapsed(false)} style={{ borderRadius: 4, backgroundColor: '#e4e7ea', paddingHorizontal: 12, paddingVertical: 6 }}>
					<Text style={{ fontSize: 14, lineHeight: 20, fontWeight: '600', color: '#2f343d' }}>Show more...</Text>
				</Pressable>
			)}
		</View>
	);
}

// Mirrors ContextBlock.tsx and ContextBlock.Item.tsx
export function ContextBlock({ block, renderer }: BlockProps<UiKit.ContextBlock>) {
	if (!Array.isArray(block.elements)) return null;

	return (
		<View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 4 }}>
			{block.elements.map((element, i) => (
				<View key={i} style={{ flexShrink: 1 }}>
					{renderer.renderContextBlockElement({ ...element, appId: block.appId, blockId: block.blockId }, i)}
				</View>
			))}
		</View>
	);
}
