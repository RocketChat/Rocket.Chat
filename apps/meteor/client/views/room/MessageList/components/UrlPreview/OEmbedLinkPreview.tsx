import { MessageGenericPreviewThumb, MessageGenericPreviewImage, MessageGenericPreview } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import OEmbedPreviewContent from './OEmbedPreviewContent';
import type { PreviewMetadata } from './PreviewList';

const OEmbedGenericPreview = ({ image, ...props }: PreviewMetadata): ReactElement => (
	<MessageGenericPreview>
		<OEmbedPreviewContent
			{...props}
			thumb={
				image ? (
					<MessageGenericPreviewThumb>
						<MessageGenericPreviewImage height={192} width={368} url={image.url} />
					</MessageGenericPreviewThumb>
				) : undefined
			}
		/>
	</MessageGenericPreview>
);

export default OEmbedGenericPreview;
