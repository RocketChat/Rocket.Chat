import React, { useState } from 'react';
import { Field, TextInput, ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../contexts/TranslationContext';
import VerticalBar from '../../../../components/VerticalBar';
import { useForm } from '../../../../hooks/useForm';
import { useComponentDidUpdate } from '../../../../hooks/useComponentDidUpdate';
import { useEndpointAction } from '../../../../hooks/useEndpointAction';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { FormSkeleton } from '../../Skeleton';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';


const initialValues = {
	name: '',
	email: '',
};

const getInitialValues = (data) => {
	if (!data) {
		return initialValues;
	}

	const { room: { name, fname } } = data;

	return {
		name: (name || fname) ?? '',
	};
};

export function RoomEditWithData({ id, reload, close }) {
	const t = useTranslation();
	const { value: data, phase: state, error } = useEndpointData(`rooms.info?roomId=${ id }`);

	if ([state].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton/>;
	}

	if (error || !data || !data.room) {
		return <Box mbs='x16'>{t('Room_not_found')}</Box>;
	}

	return <RoomEdit id={id} data={data} reload={reload} close={close} />;
}

export function RoomEdit({ id, data, reload, close }) {
	const t = useTranslation();

	const { values, handlers } = useForm(getInitialValues(data));

	const {
		handleName,
	} = handlers;
	const {
		name,
	} = values;


	const [nameError, setNameError] = useState();


	const saveRoom = useEndpointAction('POST', 'omnichannel/contact');


	const dispatchToastMessage = useToastMessageDispatch();

	useComponentDidUpdate(() => {
		setNameError(!name ? t('The_field_is_required', t('Name')) : '');
	}, [t, name]);

	const handleSave = useMutableCallback(async (e) => {
		e.preventDefault();
		let error = false;
		if (!name) {
			setNameError(t('The_field_is_required', 'name'));
			error = true;
		}

		if (error) {
			return;
		}

		const payload = {
			name,
		};

		payload._id = id;


		try {
			await saveRoom(payload);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			reload();
			close();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const formIsValid = !!name;

	return <>
		<VerticalBar.ScrollableContent is='form'>
			<Field>
				<Field.Label>{t('Name')}*</Field.Label>
				<Field.Row>
					<TextInput error={nameError} flexGrow={1} value={name} onChange={handleName} />
				</Field.Row>
				<Field.Error>
					{nameError}
				</Field.Error>
			</Field>
		</VerticalBar.ScrollableContent>
		<VerticalBar.Footer>
			<ButtonGroup stretch>
				<Button flexGrow={1} onClick={close}>{t('Cancel')}</Button>
				<Button mie='none' flexGrow={1} onClick={handleSave} disabled={!formIsValid} primary>{t('Save')}</Button>
			</ButtonGroup>
		</VerticalBar.Footer>
	</>;
}
