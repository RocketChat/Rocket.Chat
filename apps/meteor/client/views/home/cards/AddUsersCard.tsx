import type { Card } from '@rocket.chat/fuselage';
import { useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';

import { useHomeCardClassName } from './useHomeCardClassName';
import { GenericCard, GenericCardButton } from '../../../components/GenericCard';

const AddUsersCard = ({ className, ...props }: Omit<ComponentProps<typeof Card>, 'type'>) => {
	const homeCardClassName = useHomeCardClassName(className);
	const t = useTranslation();

	const router = useRouter();
	const handleOpenUsersRoute = (): void => {
		router.navigate('/admin/users');
	};

	return (
		<GenericCard
			title={t('Add_users')}
			body={t('Invite_and_add_members_to_this_workspace_to_start_communicating')}
			buttons={[
				<GenericCardButton key={1} onClick={handleOpenUsersRoute} variant='primary'>
					{t('Add_users')}
				</GenericCardButton>,
			]}
			className={homeCardClassName}
			{...props}
		/>
	);
};

export default AddUsersCard;
