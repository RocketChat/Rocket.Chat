import type { IUpload, IUploadWithUser } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Icon, TextInput, Select, Throbber, ContextualbarSection } from '@rocket.chat/fuselage';
import type { ChangeEvent } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import FileItem from './components/FileItem';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarEmptyContent,
} from '../../../../components/Contextualbar';
import { VirtualizedScrollbars } from '../../../../components/CustomScrollbars';

type RoomFilesProps = {
	loading: boolean;
	type: string;
	text: string;
	filesItems: IUploadWithUser[];
	loadMoreItems: (start: number, end: number) => void;
	setType: (value: any) => void;
	setText: (e: ChangeEvent<HTMLInputElement>) => void;
	total: number;
	onClickClose: () => void;
	onClickDelete: (id: IUpload['_id']) => void;
};

const RoomFiles = ({
	loading,
	type,
	text,
	filesItems = [],
	loadMoreItems,
	setType,
	setText,
	total,
	onClickClose,
	onClickDelete,
}: RoomFilesProps) => {
	const { t } = useTranslation();

	const options: SelectOption[] = useMemo(
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

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='attachment' />
				<ContextualbarTitle>{t('Files')}</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>
			<ContextualbarSection>
				<TextInput
					data-qa-files-search
					placeholder={t('Search_Files')}
					value={text}
					onChange={setText}
					addon={<Icon name='magnifier' size='x20' />}
				/>
				<Box w='x144' mis={8}>
					<Select onChange={setType} value={type} options={options} />
				</Box>
			</ContextualbarSection>
			<ContextualbarContent paddingInline={0}>
				{loading && (
					<Box p={24}>
						<Throbber size='x12' />
					</Box>
				)}
				{!loading && filesItems.length === 0 && <ContextualbarEmptyContent title={t('No_files_found')} />}
				{!loading && filesItems.length > 0 && (
					<Box w='full' h='full' flexShrink={1} overflow='hidden'>
						<VirtualizedScrollbars>
							<Virtuoso
								style={{
									height: '100%',
									width: '100%',
								}}
								totalCount={total}
								endReached={(start) => loadMoreItems(start, Math.min(50, total - start))}
								overscan={50}
								data={filesItems}
								itemContent={(_, data) => <FileItem fileData={data} onClickDelete={onClickDelete} />}
							/>
						</VirtualizedScrollbars>
					</Box>
				)}
			</ContextualbarContent>
		</>
	);
};

export default RoomFiles;
