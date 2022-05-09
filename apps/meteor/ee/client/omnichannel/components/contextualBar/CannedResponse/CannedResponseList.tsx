import type { ILivechatDepartment, IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, Icon, Margins, Select, TextInput } from '@rocket.chat/fuselage';
import { useAutoFocus, useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { Dispatch, FC, FormEventHandler, memo, MouseEvent, ReactElement, SetStateAction } from 'react';
import { Virtuoso } from 'react-virtuoso';

import ScrollableContentWrapper from '../../../../../../client/components/ScrollableContentWrapper';
import VerticalBar from '../../../../../../client/components/VerticalBar';
import { useTabContext } from '../../../../../../client/views/room/providers/ToolboxProvider';
import Item from './Item';
import WrapCannedResponse from './WrapCannedResponse';

const CannedResponseList: FC<{
	loadMoreItems: (start: number, end: number) => void;
	cannedItems: (IOmnichannelCannedResponse & { departmentName: ILivechatDepartment['name'] })[];
	itemCount: number;
	onClose: any;
	loading: boolean;
	options: [string, string][];
	text: string;
	setText: FormEventHandler<HTMLOrSVGElement>;
	type: string;
	setType: Dispatch<SetStateAction<string>>;
	onClickItem: (data: any) => void;
	onClickCreate: (e: MouseEvent<HTMLOrSVGElement>) => void;
	onClickUse: (e: MouseEvent<HTMLOrSVGElement>, text: string) => void;
	reload: () => void;
}> = ({
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
	onClickItem,
	onClickCreate,
	onClickUse,
	reload,
}) => {
	const t = useTranslation();
	const inputRef = useAutoFocus<HTMLInputElement>(true);

	const cannedId = useTabContext();

	const { ref, contentBoxSize: { inlineSize = 378 } = {} } = useResizeObserver<HTMLElement>({
		debounceDelay: 200,
	});

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Text>{t('Canned_Responses')}</VerticalBar.Text>
				<VerticalBar.Close onClick={onClose} />
			</VerticalBar.Header>

			<VerticalBar.Content paddingInline={0} ref={ref}>
				<Box display='flex' flexDirection='row' p='x24' flexShrink={0}>
					<Box display='flex' flexDirection='row' flexGrow={1} mi='neg-x4'>
						<Margins inline='x4'>
							<TextInput
								placeholder={t('Search')}
								value={text}
								onChange={setText}
								addon={<Icon name='magnifier' size='x20' />}
								ref={inputRef}
							/>
							<Select flexGrow={0} width='110px' onChange={setType} value={type} options={options} />
						</Margins>
					</Box>
				</Box>
				<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
					{itemCount === 0 && <Box p='x24'>{t('No_Canned_Responses')}</Box>}
					{itemCount > 0 && cannedItems.length > 0 && (
						<Virtuoso
							style={{ width: inlineSize }}
							totalCount={itemCount}
							endReached={loading ? undefined : (start): void => loadMoreItems(start, Math.min(25, itemCount - start))}
							overscan={25}
							data={cannedItems}
							components={{
								Scroller: ScrollableContentWrapper as any,
							}}
							itemContent={(_index, data): ReactElement => (
								<Item
									data={data}
									onClickItem={(): void => {
										onClickItem(data);
									}}
									onClickUse={onClickUse}
								/>
							)}
						/>
					)}
				</Box>
			</VerticalBar.Content>

			{cannedId && (
				<VerticalBar.InnerContent>
					<WrapCannedResponse
						cannedItem={cannedItems.find((canned) => canned._id === (cannedId as unknown))}
						onClickBack={onClickItem}
						onClickUse={onClickUse}
						reload={reload}
					/>
				</VerticalBar.InnerContent>
			)}

			<VerticalBar.Footer>
				<ButtonGroup stretch>
					<Button onClick={onClickCreate}>{t('Create')}</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};

export default memo(CannedResponseList);
