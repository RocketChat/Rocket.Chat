import React from 'react';
import { Button, Callout, FieldGroup, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import TriggersForm from './TriggersForm';
import PageSkeleton from '../../components/PageSkeleton';
import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useForm } from '../../hooks/useForm';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import { useRoute } from '../../contexts/RouterContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';

const EditTriggerPageContainer = ({ id, onSave }) => {
	const t = useTranslation();
	const { data, state } = useEndpointDataExperimental(`livechat/triggers/${ id }`);

	if (state === ENDPOINT_STATES.LOADING) {
		return <PageSkeleton />;
	}

	if (state === ENDPOINT_STATES.ERROR || !data?.trigger) {
		return <Callout>
			{t('Error')}: error
		</Callout>;
	}

	return <EditTriggerPage data={data.trigger} onSave={onSave}/>;
};

const getInitialValues = ({
	name,
	description,
	enabled,
	runOnce,
	conditions: [{
		name: condName,
		value: condValue,
	}],
	actions: [{
		action: actName,
		params: {
			sender: actSender,
			msg: actMsg,
			name: actSenderName,
		},
	}],
}) => ({
	name: name ?? '',
	description: description ?? '',
	enabled: !!enabled,
	runOnce: !!runOnce,
	conditions: {
		name: condName ?? 'page-url',
		value: condValue ?? '',
	},
	actions: {
		name: actName ?? '',
		params: {
			sender: actSender ?? 'queue',
			msg: actMsg ?? '',
			name: actSenderName ?? '',
		},
	},
});

const EditTriggerPage = ({ data, onSave }) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const router = useRoute('omnichannel-triggers');

	const save = useMethod('livechat:saveTrigger');

	const { values, handlers } = useForm(getInitialValues(data));

	const handleSave = useMutableCallback(async () => {
		try {
			const { actions: { params: { sender, msg, name } }, ...restValues } = values;
			await save({
				_id: data._id,
				...restValues,
				conditions: [values.conditions],
				actions: [{
					name: 'send-message',
					params: {
						sender,
						msg,
						...sender === 'custom' && { name },
					},
				}],
			});
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			onSave();
			router.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return 	<>
		<FieldGroup>
			<TriggersForm values={values} handlers={handlers}/>
		</FieldGroup>
		<ButtonGroup align='end'>
			<Button primary onClick={handleSave}>
				{t('Save')}
			</Button>
		</ButtonGroup>
	</>;
};

export default EditTriggerPageContainer;
