import { Box } from '@rocket.chat/fuselage';
import { useAttachmentAutoLoadEmbedMedia, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { useCollapse } from '../../../../../components/Message/Attachments/hooks/useCollapse';
import type { UrlPreview as UrlPreviewType } from './PreviewList';
import UrlPreviewResolver from './UrlPreviewResolver';

const UrlPreview = (props: UrlPreviewType): ReactElement => {
	const autoLoadMedia = useAttachmentAutoLoadEmbedMedia();
	const [collapsed, collapse] = useCollapse(!autoLoadMedia);
	const t = useTranslation();

	return (
		<>
			<Box mbs='x4' mbe='x2' display='flex' flexDirection='row' color='hint' fontScale='c1' alignItems='center'>
				{t('Link_Preview')} {collapse}
			</Box>
			{!collapsed && (
				<Box mb='x4'>
					<UrlPreviewResolver {...props} />
				</Box>
			)}
		</>
	);
};

export default UrlPreview;
