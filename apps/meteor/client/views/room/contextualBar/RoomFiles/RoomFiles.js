import { Box, Icon, TextInput, Select, Throbber, Margins } from '@rocket.chat/fuselage';
import { useUniqueId, useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';

import ScrollableContentWrapper from '../../../../components/ScrollableContentWrapper';
import VerticalBar from '../../../../components/VerticalBar';
import Row from './Row';

function RoomFiles({
	loading,
	filesItems = [],
	text,
	type,
	setText,
	setType,
	onClickClose,
	onClickDelete,
	total,
	loadMoreItems,
	isDeletionAllowed,
}) {
	const t = useTranslation();
	const options = useMemo(
		() => [
			['all', t('All')],
			['image', t('Images')],
			['video', t('Videos')],
			['audio', t('Audios')],
			['text', t('Texts')],
			['application', t('Files')],
		],
		[t],
	);
	const inputRef = useAutoFocus(true);

	const searchId = useUniqueId();

	const itemData = useMemo(
		() => ({
			onClickDelete,
			isDeletionAllowed,
		}),
		[isDeletionAllowed, onClickDelete],
	);

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='attachment' />
				<VerticalBar.Text>{t('Files')}</VerticalBar.Text>
				{onClickClose && <VerticalBar.Close onClick={onClickClose} />}
			</VerticalBar.Header>

			<VerticalBar.Content p='x12'>
				<Box display='flex' flexDirection='row' p='x12' flexShrink={0}>
					<Box display='flex' flexDirection='row' flexGrow={1} mi='neg-x4'>
						<Margins inline='x4'>
							<TextInput
								data-qa-files-search
								id={searchId}
								placeholder={t('Search_Files')}
								ref={inputRef}
								value={text}
								onChange={setText}
								addon={<Icon name='magnifier' size='x20' />}
							/>
							<Select flexGrow={0} width='110px' onChange={setType} value={type} options={options} />
						</Margins>
					</Box>
				</Box>

				{loading && (
					<Box p='x12'>
						<Throbber size='x12' />
					</Box>
				)}

				{!loading && filesItems.length <= 0 && (
					<Box textAlign='center' p='x12' color='neutral-600'>
						{t('No_files_found')}
					</Box>
				)}

				<Box w='full' h='full' flexShrink={1} overflow='hidden'>
					<Virtuoso
						style={{
							height: '100%',
							width: '100%',
						}}
						totalCount={total}
						endReached={loading ? () => {} : (start) => loadMoreItems(start, Math.min(50, total - start))}
						overscan={50}
						data={filesItems}
						components={{ Scroller: ScrollableContentWrapper }}
						itemContent={(index, data) => <Row data={itemData} index={index} item={data} />}
					/>
				</Box>
			</VerticalBar.Content>
		</>
	);
}

export default RoomFiles;
