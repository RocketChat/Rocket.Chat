import { Button, ButtonGroup, ContextualbarFooter } from '@rocket.chat/fuselage';
import { useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import { ContextualbarScrollableContent } from '../../../components/Contextualbar';

const AdminUserCreated = ({ uid }: { uid: string }) => {
	const t = useTranslation();
	const router = useRouter();

	const goToUser = useCallback((id) => router.navigate(`/admin/users/info/${id}`), [router]);

	return (
		<>
			<ContextualbarScrollableContent h='100%' fontScale='p1m'>
				{t('You_have_created_one_user')}
			</ContextualbarScrollableContent>
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
