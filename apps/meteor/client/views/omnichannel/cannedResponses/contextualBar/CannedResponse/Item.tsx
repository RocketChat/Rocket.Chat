import type { ILivechatDepartment, IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import {
	Box,
	Button,
	Item as FuselageItem,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemLink,
	ItemRow,
	ItemTitle,
	Tag,
} from '@rocket.chat/fuselage';
import type { MouseEvent } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useScopeDict } from '../../../hooks/useScopeDict';

export type ItemProps = {
	data: IOmnichannelCannedResponse & { departmentName?: ILivechatDepartment['name'] };
	allowUse?: boolean;
	onClickItem: (e: MouseEvent<HTMLOrSVGElement>) => void;
	onClickUse: (e: MouseEvent<HTMLOrSVGElement>, text: string) => void;
};

const Item = ({ data, allowUse, onClickItem, onClickUse }: ItemProps) => {
	const { t } = useTranslation();

	const scope = useScopeDict(data.scope, data.departmentName);

	return (
		<FuselageItem inset='lg'>
			<ItemContent>
				<ItemTitle>
					<ItemLink is='button' onClick={onClickItem}>
						!{data.shortcut}
					</ItemLink>
				</ItemTitle>
				<ItemDescription>{scope}</ItemDescription>
				<ItemDescription>"{data.text}"</ItemDescription>
				{data.tags && data.tags.length > 0 && (
					<Box is={ItemRow} flexWrap='wrap'>
						{data.tags.map((tag: string, idx: number) => (
							<Tag key={idx}>{tag}</Tag>
						))}
					</Box>
				)}
			</ItemContent>
			{allowUse && (
				<ItemActions reveal='hover'>
					<Button
						size='small'
						aria-label={t('Use_canned_response', { shortcut: data.shortcut })}
						onClick={(e): void => onClickUse(e, data.text)}
					>
						{t('Use')}
					</Button>
				</ItemActions>
			)}
		</FuselageItem>
	);
};

export default memo(Item);
