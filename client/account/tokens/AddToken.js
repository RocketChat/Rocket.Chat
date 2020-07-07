import React, { useCallback } from 'react';
import { Box, TextInput, Button, Field, Margins, CheckBox } from '@rocket.chat/fuselage';

import { useForm } from '../../hooks/useForm';
import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { InfoModal } from './AccountTokensPage';

const formObj = { name: '', bypassTwoFactor: false };

const AddToken = ({ setModal, userId, reload, ...props }) => {
	const t = useTranslation();
	const createTokenFn = useMethod('personalAccessTokens:generateToken');
	const dispatchToastMessage = useToastMessageDispatch();

	const { values, handlers, reset } = useForm(formObj);

	const { name, bypassTwoFactor } = values;
	const { handleName, handleBypassTwoFactor } = handlers;

	const closeModal = useCallback(() => setModal(null), [setModal]);

	const handleAdd = useCallback(async () => {
		try {
			const token = await createTokenFn({ tokenName: name, bypassTwoFactor });

			setModal(<InfoModal
				title={t('API_Personal_Access_Token_Generated')}
				content={<Box dangerouslySetInnerHTML={{ __html: t('API_Personal_Access_Token_Generated_Text_Token_s_UserId_s', { token, userId }) }}/>}
				confirmText={t('ok')}
				onConfirm={closeModal}
			/>);
			reset();
			reload();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [bypassTwoFactor, closeModal, createTokenFn, dispatchToastMessage, name, reload, reset, setModal, t, userId]);

	return <Box display='flex' flexDirection='column' mbe='x8' {...props}>
		<Box display='flex' flexDirection='row' alignItems='stretch' mi='neg-x2'>
			<Margins inline='x2'>
				<TextInput value={name} onChange={handleName} placeholder={t('API_Add_Personal_Access_Token')}/>
				<Button primary onClick={handleAdd}>{t('Add')}</Button>
			</Margins>
		</Box>
		<Field>
			<Box display='flex' flexDirection='row' alignItems='center' mbs='x4'>
				<Field.Row>
					<CheckBox checked={bypassTwoFactor} onChange={handleBypassTwoFactor}/>
				</Field.Row>
				<Box mis='x4'>{t('Ignore')} {t('Two Factor Authentication')}</Box>
			</Box>
		</Field>
	</Box>;
};

export default AddToken;
