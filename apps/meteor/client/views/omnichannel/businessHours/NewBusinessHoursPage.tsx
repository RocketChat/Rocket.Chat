import type { ILivechatBusinessHour, Serialized } from '@rocket.chat/core-typings';
import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import type { MutableRefObject } from 'react';
import React, { useRef, useState } from 'react';

import Page from '../../../components/Page';
import { DAYS_OF_WEEK } from './BusinessHoursForm';
import type { DaysTime } from './BusinessHoursFormContainer';
import BusinessHoursFormContainer from './BusinessHoursFormContainer';
import { mapBusinessHoursForm } from './mapBusinessHoursForm';

export type BusinessHoursData = Serialized<ILivechatBusinessHour> & {
	timezoneName?: string;
};

const closedDays = ['Saturday', 'Sunday'];
const createDefaultBusinessHours = (): BusinessHoursData =>
	({
		name: '',
		_id: '',
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
	} as unknown as BusinessHoursData);

const defaultBusinessHour = createDefaultBusinessHours();

const NewBusinessHoursPage = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [hasChanges, setHasChanges] = useState(false);

	const saveData: MutableRefObject<{
		form: Record<string, unknown>;
		multiple?: { name?: string; active?: boolean; departments?: { value: string; _id: string }[] };
		timezone?: { name: string };
	}> = useRef({ form: {} });

	const save = useMethod('livechat:saveBusinessHour');
	const router = useRoute('omnichannel-businessHours');

	const handleSave = useMutableCallback(async () => {
		const {
			current: { form, multiple: { departments, ...multiple } = {}, timezone: { name: timezoneName } = {} },
		} = saveData;

		if (multiple.name === '') {
			return dispatchToastMessage({
				type: 'error',
				message: t('error-the-field-is-required', { field: t('Name') }),
			});
		}

		const mappedForm = mapBusinessHoursForm(form as { daysOpen: string[]; daysTime: DaysTime }, defaultBusinessHour);

		const departmentsToApplyBusinessHour = departments?.map((dep) => dep.value).join(',') || '';

		try {
			const payload = {
				...defaultBusinessHour,
				...multiple,
				...(departmentsToApplyBusinessHour && { departmentsToApplyBusinessHour }),
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

	return (
		<Page>
			<Page.Header title={t('Business_Hours')}>
				<ButtonGroup>
					<Button onClick={handleReturn}>{t('Back')}</Button>
					<Button primary onClick={handleSave} disabled={!hasChanges}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<BusinessHoursFormContainer data={defaultBusinessHour} saveRef={saveData} onChange={setHasChanges} />
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default NewBusinessHoursPage;
