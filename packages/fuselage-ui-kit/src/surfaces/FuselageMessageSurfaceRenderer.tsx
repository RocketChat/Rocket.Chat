import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import { ErrorBoundary } from 'react-error-boundary'; 

import { FuselageSurfaceRenderer, renderTextObject } from './FuselageSurfaceRenderer';
import VideoConferenceBlock from '../blocks/VideoConferenceBlock';
import { AppIdProvider } from '../contexts/AppIdContext';
import { ComponentErrorFallback } from '@rocket.chat/ui-client'; 
import { errorTrackingService } from '@rocket.chat/ui-client'; 

export class FuselageMessageSurfaceRenderer extends FuselageSurfaceRenderer {
	public constructor() {
		super(['actions', 'context', 'divider', 'image', 'input', 'section', 'preview', 'video_conf', 'info_card']);
	}

	override plain_text = renderTextObject;
	override mrkdwn = renderTextObject;

	video_conf(block: UiKit.VideoConferenceBlock, context: UiKit.BlockContext, index: number): ReactElement | null {
		if (context === UiKit.BlockContext.BLOCK) {
			return (
				<ErrorBoundary 
					key={index} 
					fallback={<ComponentErrorFallback />}
					onError={(error) => errorTrackingService.reportError(error, {
						scope: 'component',
						severity: 'medium',
						recoverable: true,
						componentPath: 'FuselageMessageSurfaceRenderer.video_conf'
					})}
				>
					<AppIdProvider appId={block.appId}>
						<VideoConferenceBlock block={block} context={context} index={index} surfaceRenderer={this} />
					</AppIdProvider>
				</ErrorBoundary>
			);
		}
		return null;
	}
}
