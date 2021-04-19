import React from 'react';
import { Margins, Callout, FieldGroup, Box, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import FiltersForm from './FiltersForm';
import PageSkeleton from '../../../components/PageSkeleton';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useForm } from '../../../hooks/useForm';
import { useRoute } from '../../../contexts/RouterContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';

const EditFilterPageContainer = ({ id, onSave }) => {
	const t = useTranslation();
	const { value: data, phase: state } = useEndpointData(`livechat/filters/${ id }`);

	if (state === AsyncStatePhase.LOADING) {
		return <PageSkeleton />;
	}

	if (state === AsyncStatePhase.REJECTED || !data?.filter) {
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

	const { values, handlers, hasUnsavedChanges } = useForm(getInitialValues(data));

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

	const { name } = values;

	const canSave = name && hasUnsavedChanges;

	return 	<>
		<FieldGroup>
			<FiltersForm values={values} handlers={handlers}/>
		</FieldGroup>
		<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
			<Margins inlineEnd='x4'>
				<Button flexGrow={1} primary onClick={handleSave} disabled={!canSave}>
					{t('Save')}
				</Button>
			</Margins>
		</Box>
	</>;
};

export default EditFilterPageContainer;
