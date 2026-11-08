import type { IRole } from '@rocket.chat/core-typings';
import { Box, Button } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { GenericTableHeaderCell } from '@rocket.chat/ui-client';
import { useRoute } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

export type RoleHeaderProps = {
	_id: IRole['_id'];
	name: IRole['name'];
	description: IRole['description'];
};

const RoleHeader = ({ _id, name, description }: RoleHeaderProps) => {
	const router = useRoute('admin-permissions');

	const handleEditRole = useStableCallback(() => {
		router.push({
			context: 'edit',
			_id,
		});
	});

	return (
		<GenericTableHeaderCell>
			<Box marginInline='neg-x4'>
				<Button size='small' icon='edit' variant='secondary' onClick={handleEditRole}>
					{description || name}
				</Button>
			</Box>
		</GenericTableHeaderCell>
	);
};

export default memo(RoleHeader);
