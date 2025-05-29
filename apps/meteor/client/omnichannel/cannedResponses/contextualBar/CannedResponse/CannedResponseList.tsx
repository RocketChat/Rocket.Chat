import type { ILivechatDepartment, IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, ContextualbarEmptyContent, Icon, Margins, Select, TextInput } from '@rocket.chat/fuselage';
import { useAutoFocus, useResizeObserver } from '@rocket.chat/fuselage-hooks';
import type { Dispatch, FormEventHandler, MouseEvent, ReactElement, SetStateAction } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import Item from './Item';
import WrapCannedResponse from './WrapCannedResponse';
import {
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarInnerContent,
	ContextualbarFooter,
} from '../../../../components/Contextualbar';
import { VirtualizedScrollbars } from '../../../../components/CustomScrollbars';
import { useRoomToolbox } from '../../../../views/room/contexts/RoomToolboxContext';

type CannedResponseListProps = {
	loadMoreItems: (start: number, end: number) => void;
	cannedItems: (IOmnichannelCannedResponse & { departmentName: ILivechatDepartment['name'] })[];
	itemCount: number;
	onClose: any;
	loading: boolean;
	options: [string, string][];
	text: string;
	setText: FormEventHandler<HTMLInputElement>;
	type: string;
	setType: Dispatch<SetStateAction<string>>;
	isRoomOverMacLimit: boolean;
	onClickItem: (data: any) => void; // FIXME: fix typings
	onClickCreate: (e: MouseEvent<HTMLOrSVGElement>) => void;
	onClickUse: (e: MouseEvent<HTMLOrSVGElement>, text: string) => void;
	reload: () => void;
};

const CannedResponseList = ({
	loadMoreItems,
	cannedItems,
	itemCount,
	onClose,
	loading,
	options,
	text,
	setText,
	type,
	setType,
	isRoomOverMacLimit,
	onClickItem,
	onClickCreate,
	onClickUse,
	reload,
}: CannedResponseListProps) => {
	const { t } = useTranslation();
	const inputRef = useAutoFocus<HTMLInputElement>(true);

	const { context: cannedId } = useRoomToolbox();

	const { ref, contentBoxSize: { inlineSize = 378 } = {} } = useResizeObserver<HTMLElement>({
		debounceDelay: 200,
	});

	const cannedItem = cannedItems.find((canned) => canned._id === cannedId);

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarTitle>{t('Canned_Responses')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>

			<ContextualbarContent paddingInline={0} ref={ref}>
				<Box display='flex' flexDirection='row' p={24} flexShrink={0}>
					<Box display='flex' flexDirection='row' flexGrow={1} mi='neg-x4'>
						<Margins inline={4}>
							<TextInput
								placeholder={t('Search')}
								value={text}
								onChange={setText}
								addon={<Icon name='magnifier' size='x20' />}
								ref={inputRef}
							/>
							<Box w='x144'>
								<Select onChange={(value) => setType(String(value))} value={type} options={options} />
							</Box>
						</Margins>
					</Box>
				</Box>
				{itemCount === 0 && <ContextualbarEmptyContent title={t('No_Canned_Responses')} />}
				{itemCount > 0 && cannedItems.length > 0 && (
					<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
						<VirtualizedScrollbars>
							<Virtuoso
								style={{ width: inlineSize }}
								totalCount={itemCount}
								endReached={loading ? undefined : (start): void => loadMoreItems(start, Math.min(25, itemCount - start))}
								overscan={25}
								data={cannedItems}
								itemContent={(_index, data): ReactElement => (
									<Item
										data={data}
										allowUse={!isRoomOverMacLimit}
										onClickItem={(): void => {
											onClickItem(data);
										}}
										onClickUse={onClickUse}
									/>
								)}
							/>
						</VirtualizedScrollbars>
					</Box>
				)}
			</ContextualbarContent>

			{cannedItem && (
				<ContextualbarInnerContent>
					<WrapCannedResponse
						allowUse={!isRoomOverMacLimit}
						cannedItem={cannedItem}
						onClickBack={onClickItem}
						onClickUse={onClickUse}
						reload={reload}
					/>
				</ContextualbarInnerContent>
			)}

			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={onClickCreate}>{t('Create')}</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default memo(CannedResponseList);
