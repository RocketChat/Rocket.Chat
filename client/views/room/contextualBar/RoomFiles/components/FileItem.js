import React from 'react';
import { Box, Menu, Icon, Avatar } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';
import colors from '@rocket.chat/fuselage-tokens/colors';

import { download } from '../../../../../lib/download';
import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';
import { getURL } from '../../../../../../app/utils/client';
import FileItemIcon from './FileItemIcon';
import { useTranslation } from '../../../../../contexts/TranslationContext';

const hoverClass = css`
	&:hover{
	  	cursor: pointer;
    	background-color: ${ colors.n100 };
  	}
`;

const MenuItem = React.memo(({ _id, name, url, onClickDelete }) => {
	const t = useTranslation();
	const menuOptions = {
		downLoad: {
			label: <Box display='flex' alignItems='center'><Icon mie='x4' name='download' size='x16'/>{t('Download')}</Box>,
			action: () => {
				const URL = window.webkitURL ?? window.URL;
				const href = getURL(url);
				download(href, name);
				URL.revokeObjectURL(url);
			},
		},
		...onClickDelete && { delete: {
			label: <Box display='flex' alignItems='center' color='danger'><Icon mie='x4' name='trash' size='x16'/>{t('Delete')}</Box>,
			action: () => onClickDelete(_id),
		} },
	};

	return <Menu options={menuOptions} />;
});

export const FileItem = ({ _id, name, url, uploadedAt, user, type, typeGroup, style, userId, onClickDelete, className }) => {
	const format = useFormatDateAndTime();
	return <Box display='flex' p='x12' style={style} className={[className, hoverClass]}>
		<Box is='a' { ...typeGroup === 'image' && { className: 'gallery-item' } } download rel='noopener noreferrer' target='_blank' title={name} display='flex' width='100%' href={url} >
			{ typeGroup === 'image' ? <Avatar size='x48' url={url} /> : <FileItemIcon type={type} />}
			<Box mis='x8'>
				<Box withTruncatedText color='default' fontScale='p2'>{name}</Box>
				<Box withTruncatedText color='hint' fontScale='p1'>@{user.username}</Box>
				<Box color='hint' fontScale='micro'>{format(uploadedAt)}</Box>
			</Box>
		</Box>

		<MenuItem _id={_id} name={name} url={url} onClickDelete={user._id === userId && onClickDelete} />
	</Box>;
};

export default FileItem;
