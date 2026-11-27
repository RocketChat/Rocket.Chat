import { Callout } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';

import type { BlockProps } from './layout';

// Mirrors CalloutBlock.tsx
export function CalloutBlock({ block, renderer }: BlockProps<UiKit.CalloutBlock>) {
	if (!block.text) return null;

	return (
		<Callout
			type={block.variant}
			title={block.title?.text}
			actions={(block.accessory && renderer.renderSectionAccessoryBlockElement(block.accessory, 0)) || undefined}
		>
			{renderer.renderTextObject(block.text, 0, UiKit.BlockContext.NONE)}
		</Callout>
	);
}

const calloutTypes = { default: undefined, info: 'info', warning: 'warning', error: 'danger', success: 'success' } as const;

// Mirrors AlertBlock.tsx
export function AlertBlock({ block, renderer }: BlockProps<UiKit.AlertBlock>) {
	if (!block.text) return null;

	return <Callout type={calloutTypes[block.level ?? 'default'] ?? undefined}>{renderer.renderTextObject(block.text, 0, UiKit.BlockContext.NONE)}</Callout>;
}
