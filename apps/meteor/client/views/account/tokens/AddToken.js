import { Box, TextInput, Button, Field, FieldGroup, Margins, CheckBox } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useUserId, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import { useForm } from '../../../hooks/useForm';
import InfoModal from './InfoModal';

const initialValues = {
	name: '',
	bypassTwoFactor: false,
};

const AddToken = ({ onDidAddToken, ...props }) => {
	const t = useTranslation();
	const createTokenFn = useMethod('personalAccessTokens:generateToken');
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const userId = useUserId();

	const { values, handlers, reset } = useForm(initialValues);

	const { name, bypassTwoFactor } = values;
	const { handleName, handleBypassTwoFactor } = handlers;

	const closeModal = useCallback(() => setModal(null), [setModal]);

	const handleAdd = useCallback(async () => {
		try {
			const token = await createTokenFn({ tokenName: name, bypassTwoFactor });

			setModal(
				<InfoModal
					title={t('API_Personal_Access_Token_Generated')}
					content={
						<Box
							dangerouslySetInnerHTML={{
								__html: t('API_Personal_Access_Token_Generated_Text_Token_s_UserId_s', {
									token,
									userId,
								}),
							}}
						/>
					}
					confirmText={t('ok')}
					onConfirm={closeModal}
				/>,
			);
			reset();
			onDidAddToken();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [bypassTwoFactor, closeModal, createTokenFn, dispatchToastMessage, name, onDidAddToken, reset, setModal, t, userId]);

	const bypassTwoFactorCheckboxId = useUniqueId();

	return (
		<FieldGroup is='form' marginBlock='x8' {...props}>
			<Field>
				<Field.Row>
					<Margins inlineEnd='x4'>
						<TextInput value={name} onChange={handleName} placeholder={t('API_Add_Personal_Access_Token')} />
					</Margins>
					<Button primary disabled={name.length === 0} onClick={handleAdd}>
						{t('Add')}
					</Button>
				</Field.Row>
				<Field.Row>
					<CheckBox id={bypassTwoFactorCheckboxId} checked={bypassTwoFactor} onChange={handleBypassTwoFactor} />
					<Field.Label htmlFor={bypassTwoFactorCheckboxId}>
						{t('Ignore')} {t('Two Factor Authentication')}
					</Field.Label>
				</Field.Row>
			</Field>
		</FieldGroup>
	);
};

export default AddToken;
