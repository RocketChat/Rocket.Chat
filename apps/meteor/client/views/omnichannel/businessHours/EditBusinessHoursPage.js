import { Button, ButtonGroup, Callout } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useRef, useMemo, useState } from 'react';

import Page from '../../../components/Page';
import PageSkeleton from '../../../components/PageSkeleton';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import BusinessHoursFormContainer from './BusinessHoursFormContainer';
import { useIsSingleBusinessHours } from './BusinessHoursRouter';
import { mapBusinessHoursForm } from './mapBusinessHoursForm';

const EditBusinessHoursPage = ({ id, type }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const isSingleBH = useIsSingleBusinessHours();

	const { value: data, phase: state } = useEndpointData(
		'livechat/business-hour',
		useMemo(() => ({ _id: id, type }), [id, type]),
	);

	const saveData = useRef({ form: {} });

	const [hasChanges, setHasChanges] = useState(false);

	const save = useMethod('livechat:saveBusinessHour');
	const deleteBH = useMethod('livechat:removeBusinessHour');

	const router = useRoute('omnichannel-businessHours');

	const handleSave = useMutableCallback(async () => {
		if (state !== AsyncStatePhase.RESOLVED || !data.success) {
			return;
		}

		const {
			current: { form, multiple: { departments, ...multiple } = {}, timezone: { name: timezoneName } = {} },
		} = saveData;

		if (data.businessHour.type !== 'default' && multiple.name === '') {
			return dispatchToastMessage({
				type: 'error',
				message: t('error-the-field-is-required', { field: t('Name') }),
			});
		}

		const mappedForm = mapBusinessHoursForm(form, data.businessHour);

		const departmentsToApplyBusinessHour = departments?.map((dep) => dep.value).join(',') || '';

		try {
			const payload = {
				...data.businessHour,
				...multiple,
				departmentsToApplyBusinessHour: departmentsToApplyBusinessHour ?? '',
				timezoneName: timezoneName || data.businessHour.timezone.name,
				workHours: mappedForm,
			};

			await save(payload);
			dispatchToastMessage({ type: 'success', message: t('Business_hours_updated') });
			router.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleDelete = useMutableCallback(async () => {
		if (type !== 'custom') {
			return;
		}

		try {
			await deleteBH(id, type);
			dispatchToastMessage({ type: 'success', message: t('Business_Hour_Removed') });
			router.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleReturn = useMutableCallback(() => {
		router.push({});
	});

	if (state === AsyncStatePhase.LOADING) {
		return <PageSkeleton />;
	}

	if (state === AsyncStatePhase.REJECTED || (AsyncStatePhase.RESOLVED && !data.businessHour)) {
		return (
			<Page>
				<Page.Header title={t('Business_Hours')}>
					<Button onClick={handleReturn}>{t('Back')}</Button>
				</Page.Header>
				<Page.ScrollableContentWithShadow>
					<Callout type='danger'>{t('Error')}</Callout>
				</Page.ScrollableContentWithShadow>
			</Page>
		);
	}

	return (
		<Page>
			<Page.Header title={t('Business_Hours')}>
				<ButtonGroup>
					{!isSingleBH && <Button onClick={handleReturn}>{t('Back')}</Button>}
					{type === 'custom' && (
						<Button primary danger onClick={handleDelete}>
							{t('Delete')}
						</Button>
					)}
					<Button primary onClick={handleSave} disabled={!hasChanges}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<BusinessHoursFormContainer data={data.businessHour} saveRef={saveData} onChange={setHasChanges} />
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default EditBusinessHoursPage;
