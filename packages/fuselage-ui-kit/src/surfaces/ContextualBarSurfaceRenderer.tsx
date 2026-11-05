import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactNode } from 'react';

import { FuselageSurfaceRenderer, renderTextObject } from './FuselageSurfaceRenderer.js';
import TabNavigationBlock from '../blocks/TabNavigationBlock.js';
import { AppIdProvider } from '../contexts/AppIdContext.js';

export class ContextualBarSurfaceRenderer extends FuselageSurfaceRenderer {
	public constructor() {
		super(UiKit.contextualBarSurfaceLayoutBlockTypes);
	}

	override plain_text = renderTextObject;

	override mrkdwn = renderTextObject;

	tab_navigation(block: UiKit.ExperimentalTabNavigationBlock, context: UiKit.BlockContext, index: number): ReactNode {
		if (context === UiKit.BlockContext.BLOCK) {
			return (
				<AppIdProvider key={index} appId={block.appId}>
					<TabNavigationBlock block={block} context={context} index={index} surfaceRenderer={this} />
				</AppIdProvider>
			);
		}

		return null;
	}
}
