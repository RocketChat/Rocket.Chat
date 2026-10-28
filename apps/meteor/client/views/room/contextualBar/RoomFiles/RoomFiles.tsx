import type { IRoom, IUpload, IUploadWithUser } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Icon, TextInput, Select, Throbber } from '@rocket.chat/fuselage';
import {
	VirtualizedScrollbars,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarEmptyContent,
	ContextualbarSection,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import type { ChangeEvent } from 'react';
import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import RoomFileItemWrapper from './RoomFileItemWrapper';
import RoomFilesListWrapper from './RoomFilesListWrapper';
import FileItem from './components/FileItem';
import RoomFilesListArea from './layout/RoomFilesListArea';
import ContextualbarListFilter from '../../../../components/ContextualbarList/ContextualbarListFilter';
import ResultsLiveRegion from '../../../../components/ResultsLiveRegion';
import ContextualbarInset from '../layout/ContextualbarInset';

export type RoomFilesProps = {
	rid: IRoom['_id'];
	isPending: boolean;
	isSuccess: boolean;
	type: string;
	text: string;
	filesItems: IUploadWithUser[];
	loadMoreItems: () => void;
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
					endAddon={<Icon name='magnifier' size='x20' />}
				/>
				<ContextualbarListFilter>
					<Select aria-label={t('File_Type')} onChange={setType} value={type} options={options} />
				</ContextualbarListFilter>
			</ContextualbarSection>
			<ContextualbarContent flush>
				<ResultsLiveRegion shouldAnnounce={isSuccess} itemCount={total} />
				{isPending && (
					<ContextualbarInset>
						<Throbber size='x12' />
					</ContextualbarInset>
				)}
				{isSuccess && (
					<RoomFilesListArea id={filesListId}>
						{filesItems.length === 0 && <ContextualbarEmptyContent title={t('No_files_found')} />}
						{filesItems.length > 0 && (
							<VirtualizedScrollbars>
								<Virtuoso
									style={{
										height: '100%',
										width: '100%',
									}}
									totalCount={total}
									endReached={loadMoreItems}
									overscan={100}
									data={filesItems}
									itemContent={(_, data) => <FileItem rid={rid} fileData={data} onClickDelete={onClickDelete} />}
									components={{
										List: RoomFilesListWrapper,
										Item: RoomFileItemWrapper,
									}}
								/>
							</VirtualizedScrollbars>
						)}
					</RoomFilesListArea>
				)}
			</ContextualbarContent>
		</ContextualbarDialog>
	);
};

export default RoomFiles;
