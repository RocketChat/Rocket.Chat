import type { IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import { IconButton } from '@rocket.chat/fuselage';
import { GenericTableCell } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { useRemoveCannedResponse } from './modals/useRemoveCannedResponse';

const RemoveCannedResponseButton = ({ id }: { id: IOmnichannelCannedResponse['_id'] }) => {
	const { t } = useTranslation();

	const handleDelete = useRemoveCannedResponse(id);

	return (
		<GenericTableCell withTruncatedText>
			<IconButton
				icon='trash'
				small
				title={t('Remove')}
				onClick={(e) => {
					e.stopPropagation();
					handleDelete();
				}}
			/>
		</GenericTableCell>
	);
};

export default RemoveCannedResponseButton;
