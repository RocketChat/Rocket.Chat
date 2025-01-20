import { Button, ButtonGroup, ContextualbarFooter } from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { ContextualbarEmptyContent } from '../../../components/Contextualbar';

const AdminUserCreated = ({ uid }: { uid: string }) => {
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<>
			<ContextualbarEmptyContent icon='user' title={t('You_have_created_user')} />
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button type='reset' onClick={() => router.navigate(`/admin/users/new`)} flexBasis='0'>
						{t('Add_more_users')}
					</Button>
					<Button primary onClick={() => router.navigate(`/admin/users/info/${uid}`)} flexBasis='0'>
						{t('Done')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AdminUserCreated;
