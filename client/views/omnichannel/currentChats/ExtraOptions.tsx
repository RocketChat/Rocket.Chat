import { Box, Icon, Menu } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { usePermission } from '../../../contexts/AuthorizationContext';
import { useTranslation } from '../../../contexts/TranslationContext';

const ExtraOptions: FC<{
	handleClearFilters: any;
	handleRemoveClosed: any;
	handleCustomFieldsFilterToggle: () => void;
	canViewCustomFields: boolean;
}> = ({ handleClearFilters, handleRemoveClosed, handleCustomFieldsFilterToggle, canViewCustomFields, ...props }) => {
	const t = useTranslation();
	const canRemove = usePermission('remove-closed-livechat-rooms');

	const menuOptions = {
		...(canViewCustomFields && {
			customFields: {
				label: (
					<Box>
						<Icon name='magnifier' size='x16' marginInlineEnd='x4' />
						{t('Custom_Fields')}
					</Box>
				),
				action: handleCustomFieldsFilterToggle,
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

export default ExtraOptions;
