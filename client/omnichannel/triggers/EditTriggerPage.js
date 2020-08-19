import React from 'react';
import { Button, Callout, Box, FieldGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import TriggersForm from './TriggersForm';
import Page from '../../components/basic/Page';
import PageSkeleton from '../../components/PageSkeleton';
import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useForm } from '../../hooks/useForm';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import { useRoute } from '../../contexts/RouterContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';

const EditTriggerPageContainer = ({ id }) => {
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

	return <EditTriggerPage data={data.trigger}/>;
};

const getInitialValues = ({
	name,
	description,
	enabled,
	runOnce,
	conditions: [{
		condName,
		condValue,
	}],
	actions: [{
		actName,
		params: {
			actSender,
			actMsg,
			actSenderName,
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

const EditTriggerPage = ({ data }) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const router = useRoute('omnichannel-triggers');

	const save = useMethod('livechat:saveTrigger');

	const { values, handlers } = useForm(getInitialValues(data));

	const handleSave = useMutableCallback(async () => {
		try {
			const { actions: { sender, msg, name }, ...restValues } = values;
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
			router.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return <Page>
		<Page.Header title={t('Trigger')} >
			<Button small onClick={handleSave}>
				{t('Save')}
			</Button>
		</Page.Header>
		<Page.ScrollableContentWithShadow>
			<Box maxWidth='x600' alignSelf='center' w='full'>
				<FieldGroup>
					<TriggersForm values={values} handlers={handlers}/>
				</FieldGroup>
			</Box>
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default EditTriggerPageContainer;
