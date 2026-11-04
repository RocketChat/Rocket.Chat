import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactNode } from 'react';

import { FuselageSurfaceRenderer, renderTextObject } from './FuselageSurfaceRenderer';
import FileBlock from '../blocks/FileBlock';
import VideoConferenceBlock from '../blocks/VideoConferenceBlock';
import { AppIdProvider } from '../contexts/AppIdContext';

export class FuselageMessageSurfaceRenderer extends FuselageSurfaceRenderer {
	public constructor() {
		super(UiKit.messageSurfaceLayoutBlockTypes);
	}

	override plain_text = renderTextObject;

	override mrkdwn = renderTextObject;

	file(block: UiKit.FileBlock, context: UiKit.BlockContext, index: number): ReactNode {
		if (context === UiKit.BlockContext.BLOCK) {
			return (
				<AppIdProvider key={index} appId={block.appId}>
					<FileBlock block={block} context={context} index={index} surfaceRenderer={this} />
				</AppIdProvider>
			);
		}

		return null;
	}

	video_conf(block: UiKit.VideoConferenceBlock, context: UiKit.BlockContext, index: number): ReactNode {
		if (context === UiKit.BlockContext.BLOCK) {
			return (
				<AppIdProvider key={index} appId={block.appId}>
					<VideoConferenceBlock block={block} context={context} index={index} surfaceRenderer={this} />
				</AppIdProvider>
			);
		}

		return null;
	}
}
