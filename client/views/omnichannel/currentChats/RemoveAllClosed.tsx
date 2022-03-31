import { Box, Icon, Menu } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { hasAtLeastOnePermission } from '../../../../app/authorization/client';
import { usePermission } from '../../../contexts/AuthorizationContext';
import { useTranslation } from '../../../contexts/TranslationContext';

const RemoveAllClosed: FC<{
	handleClearFilters: any;
	handleRemoveClosed: any;
	handleCustomFields: any;
}> = ({ handleClearFilters, handleRemoveClosed, handleCustomFields, ...props }) => {
	const t = useTranslation();
	const canRemove = usePermission('remove-closed-livechat-rooms');
	const canViewCustomFields = hasAtLeastOnePermission(['view-livechat-room-customfields', 'edit-livechat-room-customfields']);

	const menuOptions = {
		...(canViewCustomFields && {
			customFields: {
				label: (
					<Box>
						<Icon name='magnifier' size='x16' marginInlineEnd='x4' />
						{t('Custom_Fields')}
					</Box>
				),
				action: handleCustomFields,
			},
		}),
		clearFilters: {
			label: (
				<Box>
					<Icon name='refresh' size='x16' marginInlineEnd='x4' />
					{t('Clear_filters')}
				</Box>
			),
			action: handleClearFilters,
		},
		...(canRemove && {
			removeClosed: {
				label: (
					<Box color='danger'>
						<Icon name='trash' size='x16' marginInlineEnd='x4' />
						{t('Delete_all_closed_chats')}
					</Box>
				),
				action: handleRemoveClosed,
			},
		}),
	};
	return <Menu alignSelf='flex-end' small={false} square options={menuOptions} placement='bottom-start' {...props} />;
};

export default RemoveAllClosed;
