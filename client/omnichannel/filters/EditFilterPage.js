import React from 'react';
import { Button, Callout, FieldGroup, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import FiltersForm from './FiltersForm';
import PageSkeleton from '../../components/PageSkeleton';
import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useForm } from '../../hooks/useForm';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import { useRoute } from '../../contexts/RouterContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';

const EditFilterPageContainer = ({ id, onSave }) => {
	const t = useTranslation();
	const { data, state } = useEndpointDataExperimental(`livechat/filters/${ id }`);

	if (state === ENDPOINT_STATES.LOADING) {
		return <PageSkeleton />;
	}

	if (state === ENDPOINT_STATES.ERROR || !data?.filter) {
		return <Callout>
			{t('Error')}: error
		</Callout>;
	}

	return <EditFilterPage data={data.filter} onSave={onSave}/>;
};

const getInitialValues = ({
	name,
	description,
	enabled,
	regex,
	slug,
}) => ({
	name: name ?? '',
	description: description ?? '',
	enabled: !!enabled,
	regex: regex ?? '',
	slug: slug ?? '',
});

const EditFilterPage = ({ data, onSave }) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const router = useRoute('omnichannel-filters');

	const save = useMethod('livechat:saveFilter');

	const { values, handlers } = useForm(getInitialValues(data));

	const handleSave = useMutableCallback(async () => {
		try {
			await save({
				_id: data._id,
				...values,
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
			<FiltersForm values={values} handlers={handlers}/>
		</FieldGroup>
		<ButtonGroup align='end'>
			<Button primary onClick={handleSave}>
				{t('Save')}
			</Button>
		</ButtonGroup>
	</>;
};

export default EditFilterPageContainer;
