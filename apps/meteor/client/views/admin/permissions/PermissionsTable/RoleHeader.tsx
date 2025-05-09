import type { IRole } from '@rocket.chat/core-typings';
import { Button } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRoute } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo } from 'react';

import { GenericTableHeaderCell } from '../../../../components/GenericTable';

type RoleHeaderProps = {
	_id: IRole['_id'];
	name: IRole['name'];
	description: IRole['description'];
};

const RoleHeader = ({ _id, name, description }: RoleHeaderProps): ReactElement => {
	const router = useRoute('admin-permissions');

	const handleEditRole = useEffectEvent(() => {
		router.push({
			context: 'edit',
			_id,
		});
	});

	return (
		<GenericTableHeaderCell pi={4} p={8}>
			<Button small icon='edit' secondary onClick={handleEditRole}>
				{description || name}
			</Button>
		</GenericTableHeaderCell>
	);
};

export default memo(RoleHeader);
