import { Box, Button, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import VerticalBar from '../../../components/VerticalBar';
import { useRoute } from '../../../contexts/RouterContext';
import { useEndpoint } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useForm } from '../../../hooks/useForm';
import RoleForm from './RoleForm';

const NewRolePage = () => {
	const t = useTranslation();
	const router = useRoute('admin-permissions');
	const dispatchToastMessage = useToastMessageDispatch();

	const { values, handlers, reset } = useForm({
		name: '',
		description: '',
		scope: 'Users',
		mandatory2fa: false,
	});

	const saveRole = useEndpoint('POST', 'roles.create');

	const handleSave = useMutableCallback(async () => {
		try {
			await saveRole(values);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			router.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return (
		<>
			<VerticalBar.ScrollableContent>
				<Box w='full' alignSelf='center' mb='neg-x8'>
					<Margins block='x8'>
						<RoleForm values={values} handlers={handlers} />
					</Margins>
				</Box>
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				<Box display='flex' flexDirection='row' justifyContent='space-between' stretch w='full'>
					<Margins inlineEnd='x4'>
						<Button flexGrow={1} type='reset' onClick={reset}>
							{t('Reset')}
						</Button>
						<Button flexGrow={1} primary onClick={handleSave}>
							{t('Save')}
						</Button>
					</Margins>
				</Box>
			</VerticalBar.Footer>
		</>
	);
};

export default NewRolePage;
