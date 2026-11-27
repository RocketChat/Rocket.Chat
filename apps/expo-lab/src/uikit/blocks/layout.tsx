import type { ReactElement } from 'react';
import { Text, View } from 'react-native';
import * as UiKit from '@rocket.chat/ui-kit';


export type BlockProps<T> = { block: T; renderer: UiKit.SurfaceRenderer<ReactElement> };

// Mirrors SectionBlock.tsx and SectionBlock.Fields.tsx of fuselage-ui-kit; the grid of fields becomes two wrapping columns
export function SectionBlock({ block, renderer }: BlockProps<UiKit.SectionBlock>) {
	const accessory = block.accessory ? { appId: block.appId, blockId: block.blockId, ...block.accessory } : undefined;
	const fields = Array.isArray(block.fields) ? block.fields : [];
	const accessoryType = accessory && UiKit.toCanonicalElementType(accessory.type);
	// Option lists need the full width, as on the web
	const stacked = accessoryType === 'checkbox' || accessoryType === 'radio_button';
	const content = (
		<View style={{ flex: stacked ? undefined : 1, minWidth: 0, gap: 8 }}>
			{block.text ? renderer.renderTextObject(block.text, 0) : null}
			{fields.length > 0 && (
				<View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 8 }}>
					{fields.map((field, i) => (
						<View key={i} style={{ flexBasis: '45%', flexGrow: 1, minWidth: 0 }}>
							{renderer.renderTextObject(field, i, UiKit.BlockContext.NONE)}
						</View>
					))}
				</View>
			)}
		</View>
	);

	if (accessory && stacked) {
		return (
			<View style={{ gap: 4 }}>
				{content}
				{renderer.renderSectionAccessoryBlockElement(accessory, 0)}
			</View>
		);
	}

	return (
		<View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
			{content}
			{accessory ? <View style={{ flexShrink: 0, maxWidth: '50%' }}>{renderer.renderSectionAccessoryBlockElement(accessory, 0)}</View> : null}
		</View>
	);
}

// Mirrors HeaderBlock.tsx: fontScale h4 (16/24, 700)
export function HeaderBlock({ block }: BlockProps<UiKit.HeaderBlock>) {
	const text = block.text?.text;
	return typeof text === 'string' ? (
		<Text accessibilityRole='header' style={{ fontSize: 16, lineHeight: 24, fontWeight: '700', color: '#1f2329' }}>
			{text}
		</Text>
	) : null;
}

// Mirrors DividerBlock.tsx
export function DividerBlock() {
	return <View style={{ height: 1, backgroundColor: '#e4e7ea' }} />;
}

// Mirrors MarkdownBlock.tsx: the block carries a bare string, which is a mrkdwn text object
export function MarkdownBlock({ block, renderer }: BlockProps<UiKit.MarkdownBlock>) {
	if (typeof block.text !== 'string') return null;
	return <View style={{ minWidth: 0 }}>{renderer.renderTextObject({ type: 'mrkdwn', text: block.text }, 0, UiKit.BlockContext.NONE)}</View>;
}
