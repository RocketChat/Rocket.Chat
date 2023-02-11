import type { IRole } from '@rocket.chat/core-typings';
import { Margins, Icon, Button } from '@rocket.chat/fuselage';
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
			<Button secondary onClick={handleEditRole}>
				<Margins inline='x2'>
					<span>{description || name}</span>
					<Icon name='edit' size='x16' />
				</Margins>
			</Button>
		</GenericTable.HeaderCell>
	);
};

export default memo(RoleHeader);
