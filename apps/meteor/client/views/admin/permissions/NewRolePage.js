import { Box, ButtonGroup, Button, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

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
	const [errors, setErrors] = useState();

	const { values, handlers } = useForm({
		name: '',
		description: '',
		scope: 'Users',
		mandatory2fa: false,
	});

	const saveRole = useEndpoint('POST', 'roles.create');

	const handleSave = useMutableCallback(async () => {
		if (values.name === '') {
			return setErrors({ name: t('error-the-field-is-required', { field: t('Role') }) });
		}

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
						<RoleForm values={values} handlers={handlers} errors={errors} />
					</Margins>
				</Box>
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				<ButtonGroup stretch w='full'>
					<Button primary onClick={handleSave}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};

export default NewRolePage;
