import type { IRole } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Margins, Box, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import GenericTable from '../../../../components/GenericTable';

type RoleHeaderProps = {
	_id: IRole['_id'];
	name: IRole['name'];
	description: IRole['description'];
};

const RoleHeader = ({ _id, name, description }: RoleHeaderProps): ReactElement => {
	const router = useRoute('admin-permissions');

	const handleEditRole = useMutableCallback(() => {
		router.push({
			context: 'edit',
			_id,
		});
	});

	return (
		<GenericTable.HeaderCell clickable pi='x4' p='x8'>
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
				onClick={handleEditRole}
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
