import { MessageGenericPreview, Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

import { useCollapse } from '../../../../../components/message/Attachments/hooks/useCollapse';
import OEmbedPreviewContent from './OEmbedPreviewContent';
import type { PreviewMetadata } from './PreviewList';

type OEmbedCollapsibleProps = { children?: ReactNode } & PreviewMetadata;

const OEmbedCollapsible = ({ children, ...props }: OEmbedCollapsibleProps): ReactElement => {
	const t = useTranslation();
	const [collapsed, collapse] = useCollapse(false);

	return (
		<>
			<Box display='flex' flexDirection='row' color='hint' fontScale='c1' alignItems='center'>
				{t('Link_Preview')} {collapse}
			</Box>
			<MessageGenericPreview>
				{!collapsed && children}
				<OEmbedPreviewContent {...props} />
			</MessageGenericPreview>
		</>
	);
};

export default OEmbedCollapsible;
