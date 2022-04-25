import { Box, Icon, Menu } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { usePermission, useAtLeastOnePermission } from '../../../contexts/AuthorizationContext';
import { useTranslation } from '../../../contexts/TranslationContext';

const ExtraOptions: FC<{
	handleClearFilters: any;
	handleRemoveClosed: any;
	handleShowCustomFields?: any;
}> = ({ handleClearFilters, handleRemoveClosed, handleShowCustomFields, ...props }) => {
	const t = useTranslation();
	const canRemove = usePermission('remove-closed-livechat-rooms');

	const menuOptions = {
		clearFilters: {
			label: (
				<Box>
					<Icon name='refresh' size='x16' marginInlineEnd='x4' />
					{t('Clear_filters')}
				</Box>
			),
			action: handleClearFilters,
		},
		// ...(handleShowCustomFields && {
		// 	customFields: {
		// 		label: (
		// 			<Box>
		// 				<Icon name='magnifier' size='x16' marginInlineEnd='x4' />
		// 				{t('Custom_Fields')}
		// 			</Box>
		// 		),
		// 		action: handleShowCustomFields,
		// 	},
		// }),
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

export default ExtraOptions;
