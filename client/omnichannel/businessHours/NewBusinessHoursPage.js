import React, { useRef } from 'react';
import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import BusinessHoursFormContainer from './BusinessHoursFormContainer';
import Page from '../../components/basic/Page';
import { useTranslation } from '../../contexts/TranslationContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useMethod } from '../../contexts/ServerContext';
import { useRoute } from '../../contexts/RouterContext';
import { mapBusinessHoursForm } from './mapBusinessHoursForm';
import { DAYS_OF_WEEK } from './BusinessHoursForm';

const closedDays = ['Saturday', 'Sunday'];
const createDefaultBusinessHours = () => ({
	name: '',
	workHours: DAYS_OF_WEEK.map((day) => ({
		day,
		start: {
			time: '00:00',
		},
		finish: {
			time: '00:00',
		},
		open: !closedDays.includes(day),
	})),
	departments: [],
	timezoneName: 'America/Sao_Paulo',
	departmentsToApplyBusinessHour: '',
});

const defaultBusinessHour = createDefaultBusinessHours();

const NewBusinessHoursPage = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const saveData = useRef({ form: {} });

	const save = useMethod('livechat:saveBusinessHour');
	const router = useRoute('omnichannel-businessHours');

	const handleSave = useMutableCallback(async () => {
		const { current: {
			form,
			multiple: { departments, ...multiple } = {},
			timezone: { name: timezoneName } = {},
		} } = saveData;

		if (multiple.name === '') {
			return dispatchToastMessage({ type: 'error', message: t('error-the-field-is-required', { field: t('Name') }) });
		}

		const mappedForm = mapBusinessHoursForm(form, defaultBusinessHour);

		const departmentsToApplyBusinessHour = departments?.join(',') || '';

		try {
			const payload = {
				...defaultBusinessHour,
				...multiple,
				...departmentsToApplyBusinessHour && { departmentsToApplyBusinessHour },
				timezoneName,
				workHours: mappedForm,
				type: 'custom',
			};

			await save(payload);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			router.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleReturn = useMutableCallback(() => {
		router.push({});
	});

	return <Page>
		<Page.Header title={t('Business_Hours')}>
			<ButtonGroup>
				<Button onClick={handleReturn}>
					{t('Back')}
				</Button>
				<Button primary onClick={handleSave}>
					{t('Save')}
				</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.ScrollableContentWithShadow>
			<BusinessHoursFormContainer data={defaultBusinessHour} saveRef={saveData}/>
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default NewBusinessHoursPage;
