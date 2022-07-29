import type { ILivechatDepartment, IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Icon, Tag } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, memo, MouseEvent, useState } from 'react';

import { useScopeDict } from '../../../hooks/useScopeDict';

const Item: FC<{
	data: IOmnichannelCannedResponse & { departmentName: ILivechatDepartment['name'] };
	onClickItem: (e: MouseEvent<HTMLOrSVGElement>) => void;
	onClickUse: (e: MouseEvent<HTMLOrSVGElement>, text: string) => void;
}> = ({ data, onClickItem, onClickUse }) => {
	const t = useTranslation();

	const scope = useScopeDict(data.scope, data.departmentName);

	const clickable = css`
		cursor: pointer;
	`;

	const [visibility, setVisibility] = useState(false);

	return (
		<Box
			pbs={16}
			pbe={12}
			pi={24}
			borderBlockEndWidth='2px'
			borderBlockEndColor='neutral-200'
			borderBlockEndStyle='solid'
			onClick={onClickItem}
			className={clickable}
			onMouseEnter={(): void => setVisibility(true)}
			onMouseLeave={(): void => setVisibility(false)}
		>
			<Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center'>
				<Box w='full' minWidth={0}>
					<Box fontScale='p2m' withTruncatedText>
						!{data.shortcut}
					</Box>
					<Box fontScale='c1' color='info' withTruncatedText>
						{scope}
					</Box>
				</Box>
				<Box display='flex' flexDirection='row' alignItems='center'>
					<Button
						display={visibility ? 'block' : 'none'}
						small
						onClick={(e): void => {
							onClickUse(e, data.text);
						}}
					>
						{t('Use')}
					</Button>
					<Icon name='chevron-left' size={24} color='neutral-700' />
				</Box>
			</Box>
			<Box fontScale='p2' mbs='8px' color='info' withTruncatedText>
				"{data.text}"
			</Box>
			{data.tags && data.tags.length > 0 && (
				<Box display='flex' w='full' flexDirection='row' mbs='8px' flexWrap='wrap'>
					{data.tags.map((tag: string, idx: number) => (
						<Box key={idx} mie='4px' mbe='4px'>
							<Tag>{tag}</Tag>
						</Box>
					))}
				</Box>
			)}
		</Box>
	);
};

export default memo(Item);
