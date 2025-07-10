import type { ILivechatBusinessHour, LivechatBusinessHourTypes, Serialized } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useMethod, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import type { BusinessHoursFormData } from './BusinessHoursForm';
import BusinessHoursForm from './BusinessHoursForm';
import { defaultWorkHours } from './mapBusinessHoursForm';
import { useIsSingleBusinessHours } from './useIsSingleBusinessHours';
import { Page, PageFooter, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';
import { useRemoveBusinessHour } from '../../../omnichannel/businessHours/useRemoveBusinessHour';

const getInitialData = (businessHourData: Serialized<ILivechatBusinessHour> | undefined) => ({
	name: businessHourData?.name || '',
	timezoneName: businessHourData?.timezone?.name || 'America/Sao_Paulo',
	daysOpen: (businessHourData?.workHours || defaultWorkHours()).filter(({ open }) => !!open).map(({ day }) => day),
	daysTime: (businessHourData?.workHours || defaultWorkHours())
		.filter(({ open }) => !!open)
		.map(({ day, start: { time: startTime }, finish: { time: finishTime }, open }) => ({
			day,
			start: { time: startTime },
			finish: { time: finishTime },
			open,
		})),
	departmentsToApplyBusinessHour: '',
	active: businessHourData?.active ?? true,
	departments: businessHourData?.departments?.map(({ _id, name }) => ({ value: _id, label: name })) || [],
});

type EditBusinessHoursProps = {
	businessHourData?: Serialized<ILivechatBusinessHour>;
	type: LivechatBusinessHourTypes;
};

const EditBusinessHours = ({ businessHourData, type }: EditBusinessHoursProps) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const isSingleBH = useIsSingleBusinessHours();

	const saveBusinessHour = useMethod('livechat:saveBusinessHour');
	const handleRemove = useRemoveBusinessHour();

	const router = useRouter();

	const methods = useForm({ values: getInitialData(businessHourData) });
	const {
		reset,
		handleSubmit,
		formState: { isDirty },
	} = methods;

	const handleSave = useEffectEvent(async ({ departments, ...data }: BusinessHoursFormData) => {
		const departmentsToApplyBusinessHour = departments?.map((dep) => dep.value).join(',') || '';

		try {
			const payload = {
				...data,
				...(businessHourData?._id && { _id: businessHourData._id }),
				type,
				departmentsToApplyBusinessHour,
				timezone: data.timezoneName,
				workHours: data.daysTime.map(({ day, start: { time: startTime }, finish: { time: finishTime }, open }) => ({
					day,
					start: startTime,
					finish: finishTime,
					open,
				})),
			};

			await saveBusinessHour(payload as any);
			dispatchToastMessage({ type: 'success', message: t('Business_hours_updated') });
			router.navigate('/omnichannel/businessHours');
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const formId = useId();

	return (
		<Page>
			<PageHeader title={t('Business_Hours')}>
				<ButtonGroup>
					{!isSingleBH && <Button onClick={() => router.navigate('/omnichannel/businessHours')}>{t('Back')}</Button>}
					{type === 'custom' && businessHourData?._id && (
						<Button danger onClick={() => handleRemove(businessHourData?._id, type)}>
							{t('Delete')}
						</Button>
					)}
				</ButtonGroup>
			</PageHeader>
			<PageScrollableContentWithShadow>
				<Box maxWidth='600px' w='full' alignSelf='center'>
					<FormProvider {...methods}>
						<form id={formId} onSubmit={handleSubmit(handleSave)}>
							<BusinessHoursForm type={type} />
						</form>
					</FormProvider>
				</Box>
			</PageScrollableContentWithShadow>
			<PageFooter isDirty={isDirty}>
				<ButtonGroup>
					<Button onClick={() => reset()}>{t('Cancel')}</Button>
					<Button form={formId} primary type='submit'>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</PageFooter>
		</Page>
	);
};

export default EditBusinessHours;
