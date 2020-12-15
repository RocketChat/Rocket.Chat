import React from 'react';
import { Box, Menu, Icon, Avatar } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { css } from '@rocket.chat/css-in-js';

import { download } from '../../../../../lib/download';
import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';
import { getURL } from '../../../../../../app/utils/client';

const hoverClass = css`
	&:hover{
	  cursor: pointer;
    background-color: ${ colors.n100 };
  }
`;

const MenuItem = ({ _id, name, url, onClickDelete }) => {
	const menuOptions = {
		downLoad: {
			label: <Box display='flex' alignItems='center'><Icon mie='x4' name='download' size='x16'/>Download</Box>,
			action: () => {
				const URL = window.webkitURL ?? window.URL;
				const href = getURL(url);
				download(href, name);
				URL.revokeObjectURL(url);
			},
		},
		...onClickDelete && { delete: {
			label: <Box display='flex' alignItems='center' color='danger'><Icon mie='x4' name='trash' size='x16'/>Delete</Box>,
			action: () => onClickDelete(_id),
		} },
	};

	return <Menu options={menuOptions} />;
};

export const FileItem = ({ fileData: { _id, name, url, uploadedAt, user }, style, userId, onClickDelete, className }) => {
	const format = useFormatDateAndTime();
	return <Box display='flex' p='x12' style={style} className={[className, hoverClass]}>
		<Box is='a' download rel='noopener noreferrer' target='_blank' title={name} display='flex' width='100%' href={url} >
			<Avatar size='x48' url={url} />

			<Box mis='x8'>
				<Box withTruncatedText maxWidth='x240' color={colors.n800} fontScale='p2'>{name}</Box>
				<Box withTruncatedText color={colors.n600} fontScale='p1'>@{user.username}</Box>
				<Box color={colors.n600} fontScale='micro'>{format(uploadedAt)}</Box>
			</Box>
		</Box>

		<MenuItem _id={_id} name={name} url={url} onClickDelete={user._id === userId && onClickDelete} />
	</Box>;
};

export default FileItem;
