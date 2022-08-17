import { Box, TextInput, Button, Field, FieldGroup, Margins, CheckBox } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useUserId, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useCallback } from 'react';

import GenericModal from '../../../../components/GenericModal';
import { useForm } from '../../../../hooks/useForm';

const initialValues = {
	name: '',
	bypassTwoFactor: false,
};

const AddToken = ({ reload, ...props }: { reload: () => void }): ReactElement => {
	const t = useTranslation();
	const userId = useUserId();
	const createTokenFn = useMethod('personalAccessTokens:generateToken');
	const dispatchToastMessage = useToastMessageDispatch();
	const bypassTwoFactorCheckboxId = useUniqueId();
	const setModal = useSetModal();

	const { values, handlers, reset } = useForm(initialValues);
	const { name, bypassTwoFactor } = values as typeof initialValues;
	const { handleName, handleBypassTwoFactor } = handlers;

	const handleAddToken = useCallback(async () => {
		try {
			const token = await createTokenFn({ tokenName: name, bypassTwoFactor });

			setModal(
				<GenericModal title={t('API_Personal_Access_Token_Generated')} onConfirm={(): void => setModal(null)}>
					<Box
						dangerouslySetInnerHTML={{
							__html: t('API_Personal_Access_Token_Generated_Text_Token_s_UserId_s', {
								token,
								userId,
							}),
						}}
					/>
				</GenericModal>,
			);
			reset();
			reload();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [bypassTwoFactor, createTokenFn, dispatchToastMessage, name, reload, reset, setModal, t, userId]);

	return (
		<FieldGroup is='form' marginBlock='x8' {...props}>
			<Field>
				<Field.Row>
					<Margins inlineEnd='x4'>
						<TextInput data-qa='PersonalTokenField' value={name} onChange={handleName} placeholder={t('API_Add_Personal_Access_Token')} />
					</Margins>
					<Button primary disabled={name.length === 0} onClick={handleAddToken}>
						{t('Add')}
					</Button>
				</Field.Row>
				<Field.Row>
					<CheckBox id={bypassTwoFactorCheckboxId} checked={bypassTwoFactor} onChange={handleBypassTwoFactor} />
					<Field.Label htmlFor={bypassTwoFactorCheckboxId}>{t('Ignore_Two_Factor_Authentication')}</Field.Label>
				</Field.Row>
			</Field>
		</FieldGroup>
	);
};

export default AddToken;
