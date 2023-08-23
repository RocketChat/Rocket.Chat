import { Box, Menu, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import { getURL } from '../../../../../../app/utils/client';
import { download } from '../../../../../lib/download';

const MenuItem = ({ _id, name, url, onClickDelete }) => {
	const t = useTranslation();
	const menuOptions = {
		downLoad: {
			label: (
				<Box display='flex' alignItems='center'>
					<Icon mie={4} name='download' size='x16' />
					{t('Download')}
				</Box>
			),
			action: () => {
				const URL = window.webkitURL ?? window.URL;
				const href = getURL(url);
				download(href, name);
				URL.revokeObjectURL(url);
			},
		},
		...(onClickDelete && {
			delete: {
				label: (
					<Box display='flex' alignItems='center' color='status-font-on-danger'>
						<Icon mie={4} name='trash' size='x16' />
						{t('Delete')}
					</Box>
				),
				action: () => onClickDelete(_id),
			},
		}),
	};

	return <Menu options={menuOptions} />;
};

export default memo(MenuItem);
