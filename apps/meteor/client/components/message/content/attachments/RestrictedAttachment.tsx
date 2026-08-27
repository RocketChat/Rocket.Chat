import { Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import AttachmentBlock from './structure/AttachmentBlock';
import AttachmentContent from './structure/AttachmentContent';
import AttachmentText from './structure/AttachmentText';

const RestrictedAttachment = () => {
	const t = useTranslation();

	return (
		<AttachmentBlock color="hint">
			<AttachmentContent>
				<AttachmentText>
					<Icon name="ban" size="x16" verticalAlign="middle" marginInlineEnd={4} />
					{t('Attachment_Restricted' as any)}
				</AttachmentText>
			</AttachmentContent>
		</AttachmentBlock>
	);
};

export default memo(RestrictedAttachment);
