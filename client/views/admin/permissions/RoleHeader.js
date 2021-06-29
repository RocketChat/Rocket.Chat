import { css } from '@rocket.chat/css-in-js';
import { Margins, Box, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo } from 'react';

import GenericTable from '../../../components/GenericTable';

const RoleHeader = ({ router, _id, name, description, ...props }) => {
	const onClick = useMutableCallback(() => {
		router.push({
			context: 'edit',
			_id,
		});
	});

	return (
		<GenericTable.HeaderCell clickable pi='x4' p='x8' {...props}>
			<Box
				className={css`
					white-space: nowrap;
				`}
				pb='x8'
				pi='x12'
				mi='neg-x2'
				borderStyle='solid'
				borderWidth='x2'
				borderRadius='x2'
				borderColor='neutral-300'
				onClick={onClick}
			>
				<Margins inline='x2'>
					<span>{description || name}</span>
					<Icon name='edit' size='x16' />
				</Margins>
			</Box>
		</GenericTable.HeaderCell>
	);
};

export default memo(RoleHeader);
