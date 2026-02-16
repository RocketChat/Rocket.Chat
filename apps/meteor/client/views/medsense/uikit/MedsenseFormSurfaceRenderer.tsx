import { Margins } from '@rocket.chat/fuselage';
import { FuselageSurfaceRenderer, createSurfaceRenderer, renderTextObject } from '@rocket.chat/fuselage-ui-kit';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement, ReactNode } from 'react';

import { getMedsenseActionsClassName, getMedsenseInputClassName } from './MedsenseFormBlocks';

const MedsenseMessageSurface = ({ children }: { children: ReactNode }): ReactElement => (
	<div className='medsenseUIKit medsenseUIKit--message'>
		<Margins blockEnd={16}>{children}</Margins>
	</div>
);

const MedsenseModalSurface = ({ children }: { children: ReactNode }): ReactElement => (
	<div className='medsenseUIKit medsenseUIKit--modal'>
		<Margins blockEnd={16}>{children}</Margins>
	</div>
);

class MedsenseMessageRenderer extends FuselageSurfaceRenderer {
	public constructor() {
		super(['actions', 'context', 'divider', 'image', 'input', 'section', 'preview', 'video_conf', 'info_card']);
	}

	override plain_text = renderTextObject;

	override mrkdwn = renderTextObject;

	override actions(block: UiKit.ActionsBlock, context: UiKit.BlockContext, index: number): ReactElement | null {
		const rendered = super.actions(block, context, index);
		if (!rendered || context !== UiKit.BlockContext.BLOCK) {
			return rendered;
		}

		return <div className={getMedsenseActionsClassName(block)}>{rendered}</div>;
	}

	override input(block: UiKit.InputBlock, context: UiKit.BlockContext, index: number): ReactElement | null {
		const rendered = super.input(block, context, index);
		if (!rendered || context !== UiKit.BlockContext.BLOCK) {
			return rendered;
		}

		return <div className={getMedsenseInputClassName(block)}>{rendered}</div>;
	}
}

class MedsenseModalRenderer extends FuselageSurfaceRenderer {
	public constructor() {
		super(['actions', 'context', 'divider', 'image', 'input', 'section', 'preview', 'callout']);
	}

	override plain_text = renderTextObject;

	override mrkdwn = renderTextObject;

	override actions(block: UiKit.ActionsBlock, context: UiKit.BlockContext, index: number): ReactElement | null {
		const rendered = super.actions(block, context, index);
		if (!rendered || context !== UiKit.BlockContext.BLOCK) {
			return rendered;
		}

		return <div className={getMedsenseActionsClassName(block)}>{rendered}</div>;
	}

	override input(block: UiKit.InputBlock, context: UiKit.BlockContext, index: number): ReactElement | null {
		const rendered = super.input(block, context, index);
		if (!rendered || context !== UiKit.BlockContext.BLOCK) {
			return rendered;
		}

		return <div className={getMedsenseInputClassName(block)}>{rendered}</div>;
	}
}

export const medsenseMessageParser = new MedsenseMessageRenderer();
export const medsenseModalParser = new MedsenseModalRenderer();

export const MedsenseUiKitMessageSurface = createSurfaceRenderer(MedsenseMessageSurface, medsenseMessageParser);
export const MedsenseUiKitModalSurface = createSurfaceRenderer(MedsenseModalSurface, medsenseModalParser);
