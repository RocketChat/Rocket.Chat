import React from 'react';
import { Box, Menu, Icon } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { css } from '@rocket.chat/css-in-js';

const hoverClass = css`
	&:hover{
	  cursor: pointer;
    background-color: ${ colors.n100 };
  }
`;

export const MenuItem = ({ isMine }) => {
	const menuOptions = {
		downLoad: {
			label: <Box display='flex' alignItems='center'><Icon mie='x4' name='download' size='x16'/>Download</Box>,
			action: () => console.log('[...] is now admin'),
		},
		...isMine && { delete: {
			label: <Box display='flex' alignItems='center' color='danger'><Icon mie='x4' name='trash' size='x16'/>Delete</Box>,
			action: () => console.log('[...] no longer exists'),
		} },
	};

	return <Menu options={menuOptions} />;
};

const FileItem = ({ imgUrl, fileUrl, fileName, uploadedAt, userName, isMine }, className) => (
	<Box display='flex' p='x12' className={[className, hoverClass]}>
		<Box is='a' title={fileName} display='flex' width='100%' href={fileUrl} >
			<Box size='x50' borderRadius='2px' style={{
				backgroundImage: `url(${ imgUrl })`,
				backgroundRepeat: 'no-repeat',
				backgroundSize: 'cover',
			}} />

			<Box mis='x8'>
				<Box>
					<Box withTruncatedText maxWidth='x240' color={colors.n800} fontScale='p2'>{fileName}</Box>
					<Box withTruncatedText color={colors.n600} fontScale='p1'>@{userName}</Box>
					<Box color={colors.n600} fontScale='micro'>{uploadedAt}</Box>
				</Box>
			</Box>
		</Box>

		<MenuItem isMine={isMine} />
	</Box>
);

export default FileItem;
