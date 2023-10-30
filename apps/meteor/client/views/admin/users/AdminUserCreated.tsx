import { Button, ButtonGroup, ContextualbarFooter } from '@rocket.chat/fuselage';
import { useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import { ContextualbarEmptyContent } from '../../../components/Contextualbar';

const AdminUserCreated = ({ uid, createdUsersCount }: { uid: string; createdUsersCount: number }) => {
	const t = useTranslation();
	const router = useRouter();

	const goToUser = useCallback((id) => router.navigate(`/admin/users/info/${id}`), [router]);

	return (
		<>
			<ContextualbarEmptyContent
				h='100%'
				fontScale='p1m'
				icon='user'
				title={createdUsersCount === 1 ? t('You_have_created_one_user') : t('You_have_created_users', { count: createdUsersCount })}
			/>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button type='reset' w='50%' onClick={() => router.navigate(`/admin/users/new`)}>
						{t('Add_more_users')}
					</Button>
					<Button primary w='50%' onClick={() => goToUser(uid)}>
						{t('Done')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AdminUserCreated;
