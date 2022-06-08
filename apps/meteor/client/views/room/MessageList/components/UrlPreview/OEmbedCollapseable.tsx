import { MessageGenericPreview, Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, ReactNode } from 'react';

import { useCollapse } from '../../../../../components/Message/Attachments/hooks/useCollapse';
import OEmbedPreviewContent from './OEmbedPreviewContent';
import type { PreviewMetadata } from './PreviewList';

type OEmbedCollapseableProps = { thumb?: ReactElement; children?: ReactNode } & PreviewMetadata;

const OEmbedCollapseable = ({ children, ...props }: OEmbedCollapseableProps): ReactElement => {
	const t = useTranslation();
	const [collapsed, collapse] = useCollapse(false);

	return (
		<>
			<Box display='flex' flexDirection='row' color='hint' fontScale='c1'>
				{t('Link_Preview')} {collapse}
			</Box>
			<MessageGenericPreview>
				{!collapsed && children}
				<OEmbedPreviewContent {...props} />
			</MessageGenericPreview>
		</>
	);
};

export default OEmbedCollapseable;
