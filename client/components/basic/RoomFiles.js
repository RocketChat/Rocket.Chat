import React from 'react';
import {
	Box,
	Icon,
	SearchInput,
	Field,
	FieldGroup,
	Select,
	Throbber,
	Menu,
} from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { css } from '@rocket.chat/css-in-js';

import { useTranslation } from '../../contexts/TranslationContext';
import VerticalBar from './VerticalBar';

const hoverClass = css`
	&:hover{
		cursor: pointer;
    background-color: ${ colors.n100 };
	}
`;

export const MenuItem = ({ isMine }) => {
	let menuOptions = {
		downLoad: {
			label: <Box display='flex' alignItems='center'><Icon mie='x4' name='download' size='x16'/>Download</Box>,
			action: () => console.log('[...] is now admin'),
		},
	};

	if (isMine) {
		menuOptions = {
			downLoad: {
				label: <Box display='flex' alignItems='center'><Icon mie='x4' name='download' size='x16'/>Download</Box>,
				action: () => console.log('[...] is now admin'),
			},
			delete: {
				label: <Box display='flex' alignItems='center' color='danger'><Icon mie='x4' name='trash' size='x16'/>Delete</Box>,
				action: () => console.log('[...] no longer exists'),
			},
		};
	}

	return <Menu options={menuOptions} />;
};

export const Item = ({ imgUrl, fileUrl, fileName, uploadedAt, userName, isMine }, className) => (
	<Box display='flex' p='x12' mbe='x0' className={[className, hoverClass]}>
		<Box is='a' title={fileName} display='flex' width='100%' href={fileUrl} >
			<Box size='x50' borderRadius='2px' style={{
				backgroundImage: `url(${ imgUrl })`,
				backgroundRepeat: 'no-repeat',
				backgroundSize: 'cover',
			}} />

			<Box mis='x8'>
				<Box>
					<Box withTruncatedText maxWidth='x240' color={colors.n800} fontSize='14px' lineHeight='1.5' is='p'>{fileName}</Box>
					<Box withTruncatedText is='p' color={colors.n600} fontWeight='600' fontSize='12px'>@{userName}</Box>
					<Box fontSize='12px' color={colors.n600} is='p'>{uploadedAt}</Box>
				</Box>
			</Box>
		</Box>

		<MenuItem isMine={isMine} />
	</Box>
);

export const RoomFiles = function RoomFiles({
	loading,
	options,
	filesData,
	onClickClose,
}) {
	const t = useTranslation();

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='attachment'/>
				<VerticalBar.Text>{t('Files')}</VerticalBar.Text>
				<VerticalBar.Close onClick={onClickClose} />
			</VerticalBar.Header>

			<Box direction='row' display='flex' p='x24' pbe='x0'>
				<Box width='full'>
					<FieldGroup>
						<Field>
							<Field.Label htmlFor='test' flexGrow={0}>{t('Search_by_file_name')}</Field.Label>
							<Field.Row>
								<SearchInput id='test' placeholder='Search files...' addon={<Icon name='magnifier' size='x20' />} />
							</Field.Row>
						</Field>
					</FieldGroup>
				</Box>

				<Box width='full' mis='x16' mbs='x24'>
					<FieldGroup>
						<Field>
							<Field.Row>
								<Select options={options} />
							</Field.Row>
						</Field>
					</FieldGroup>
				</Box>
			</Box>

			<VerticalBar.ScrollableContent p='x12'>
				{loading && <Box p='x12'><Throbber size='x12' /></Box>}

				{filesData && filesData.length > 0 ? filesData.map((fileData) => <RoomFiles.Item {...fileData} />) : !loading && <Box p='x12' is='h2'>No files available.</Box>}
			</VerticalBar.ScrollableContent>
		</>
	);
};

RoomFiles.Item = Item;

export default React.memo(RoomFiles);
