import { Callout } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';

import type { BlockProps } from '../utils/BlockProps';

export type AlertBlockProps = BlockProps<UiKit.AlertBlock>;

const calloutTypes = { default: undefined, info: 'info', warning: 'warning', error: 'danger', success: 'success' } as const;

const AlertBlock = ({ className, block, surfaceRenderer }: AlertBlockProps) => (
	<Callout className={className} type={calloutTypes[block.level ?? 'default']} role='alert'>
		{surfaceRenderer.renderTextObject(block.text, 0, UiKit.BlockContext.NONE)}
	</Callout>
);

export default AlertBlock;
