import type { IRoom, IUpload, IUploadWithUser } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Icon, TextInput, Select, Throbber, ContextualbarSection } from '@rocket.chat/fuselage';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarEmptyContent,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import type { UseInfiniteQueryResult } from '@tanstack/react-query';
import type { ChangeEvent } from 'react';
import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import RoomFileItemWrapper from './RoomFileItemWrapper';
import FileItem from './components/FileItem';
import { PaginatedVirtualList } from '../../../../components/PaginatedVirtualList';
import ResultsLiveRegion from '../../../../components/ResultsLiveRegion';

type RoomFilesProps = {
	rid: IRoom['_id'];
	isPending: boolean;
	isSuccess: boolean;
	type: string;
	text: string;
	filesItems: IUploadWithUser[];
	loadMoreItems: UseInfiniteQueryResult['fetchNextPage'];
	setType: (value: any) => void;
	setText: (e: ChangeEvent<HTMLInputElement>) => void;
	total: number;
	onClickClose: () => void;
	onClickDelete: (id: IUpload['_id']) => void;
};

const RoomFiles = ({
	rid,
	isPending,
	isSuccess,
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
	const filesListId = useId();
	const filesListLabel = t('Files_list');

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
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='attachment' />
				<ContextualbarTitle>{t('Files')}</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>
			<ContextualbarSection>
				<TextInput
					data-qa-files-search
					placeholder={t('Search_Files')}
					aria-label={t('Search_Files')}
					aria-controls={isSuccess ? filesListId : undefined}
					value={text}
					onChange={setText}
					addon={<Icon name='magnifier' size='x20' />}
				/>
				<Box w='x144' mis={8}>
					<Select aria-controls={isSuccess ? filesListId : undefined} onChange={setType} value={type} options={options} />
				</Box>
			</ContextualbarSection>
			<ContextualbarContent paddingInline={0}>
				<ResultsLiveRegion shouldAnnounce={isSuccess} itemCount={total} />
				{isPending && (
					<Box p={24}>
						<Throbber size='x12' />
					</Box>
				)}
				{isSuccess && (
					<Box w='full' h='full' id={filesListId} flexShrink={1} overflow='hidden'>
						{filesItems.length === 0 && <ContextualbarEmptyContent title={t('No_files_found')} />}
						{filesItems.length > 0 && (
							<Box h='full' w='full' style={{ minHeight: 0 }}>
								<PaginatedVirtualList
									items={filesItems}
									totalCount={total}
									listLabel={filesListLabel}
									overscan={100}
									onEndReached={loadMoreItems}
									renderItem={(data) => (
										<RoomFileItemWrapper>
											<FileItem rid={rid} fileData={data} onClickDelete={onClickDelete} />
										</RoomFileItemWrapper>
									)}
								/>
							</Box>
						)}
					</Box>
				)}
			</ContextualbarContent>
		</ContextualbarDialog>
	);
};

export default RoomFiles;
