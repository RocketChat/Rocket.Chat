import {
	Field,
	FieldLabel,
	FieldRow,
	TextInput,
	ToggleSwitch,
	ButtonGroup,
	Button,
	Box,
	Divider,
	FieldGroup,
} from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { Page, PageHeader, PageScrollableContentWithShadow } from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint, useToastMessageDispatch, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';

import PharmacyMembersTable from './PharmacyMembersTable/PharmacyMembersTable';

const WEEKDAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const CHANNEL_OPTIONS = [
	{ value: 'none', label: 'None' },
	{ value: 'sms', label: 'SMS' },
	{ value: 'email', label: 'Email' },
	{ value: 'both', label: 'Both' },
];

const buildDefaultOperatingHours = () => ({
	monday: { enabled: true, start: '09:00', end: '17:00' },
	tuesday: { enabled: true, start: '09:00', end: '17:00' },
	wednesday: { enabled: true, start: '09:00', end: '17:00' },
	thursday: { enabled: true, start: '09:00', end: '17:00' },
	friday: { enabled: true, start: '09:00', end: '17:00' },
	saturday: { enabled: false, start: '09:00', end: '17:00' },
	sunday: { enabled: false, start: '09:00', end: '17:00' },
});

const buildEmptyOperatingHours = () =>
	WEEKDAY_KEYS.reduce(
		(hours, day) => ({
			...hours,
			[day]: { enabled: false, start: '', end: '' },
		}),
		{} as Record<(typeof WEEKDAY_KEYS)[number], { enabled: boolean; start: string; end: string }>,
	);

const parseRecipientText = (value: string): string[] =>
	String(value || '')
		.split(/[\n,]+/)
		.map((item) => item.trim())
		.filter(Boolean);

const EditPharmacy = ({ id }: { id?: string }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const router = useRouter();
	const queryClient = useQueryClient();
	const detectedTimezone = React.useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Toronto', []);

	const { control, handleSubmit, reset, register, setValue, watch, formState: { isDirty } } = useForm({
		defaultValues: {
			name: '',
			slug: '',
			active: true,
			voiceInboundNumber: '',
			timezone: detectedTimezone,
			operatingHours: buildDefaultOperatingHours(),
			afterHoursPatientDelivery: 'both',
			afterHoursPharmacyDelivery: 'both',
			patientMessageTemplate: '',
			pharmacySmsRecipientsText: '',
			pharmacyEmailRecipientsText: '',
			memberList: [],
		},
	});

	const name = watch('name');
	React.useEffect(() => {
		if (!id && name) {
			const generatedSlug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
			setValue('slug', generatedSlug, { shouldValidate: true, shouldDirty: true });
		}
	}, [name, id, setValue]);

	const getPharmacyInfo = useEndpoint('GET', '/v1/medsense/pharmacies.info');
	const getMembers = useEndpoint('GET', '/v1/medsense/pharmacies.members.list');

	const createPharmacy = useEndpoint('POST', '/v1/medsense/pharmacies.create');
	const updatePharmacy = useEndpoint('POST', '/v1/medsense/pharmacies.update');

	const inviteMember = useEndpoint('POST', '/v1/medsense/pharmacies.members.invite');
	const removeMember = useEndpoint('POST', '/v1/medsense/pharmacies.members.remove');
	const updateMember = useEndpoint('POST', '/v1/medsense/pharmacies.members.update');

	const { data: pharmacyData } = useQuery({
		queryKey: ['medsense-pharmacy', id],
		queryFn: async () => {
			if (!id) return null;
			const { pharmacy } = await getPharmacyInfo({ pharmacyId: id });

			let members = [];
			if (pharmacy) {
				const membersResult = await getMembers({ pharmacyId: id });
				// @ts-ignore
				members = membersResult.members.map((m) => ({
					userId: m.userId,
					username: m.user?.username,
					name: m.user?.name,
					roles: m.roles,
				}));
			}
			return { pharmacy, members };
		},
		enabled: !!id,
	});

	React.useEffect(() => {
		if (pharmacyData?.pharmacy) {
			const pharmacy = pharmacyData.pharmacy;
			const operatingHours = pharmacy.operatingHours || buildEmptyOperatingHours();
			reset({
				name: pharmacy.name,
				slug: pharmacy.slug,
				active: pharmacy.active,
				voiceInboundNumber: pharmacy.voiceInboundNumber || '',
				timezone: pharmacy.timezone || '',
				operatingHours,
				afterHoursPatientDelivery: pharmacy.afterHoursPolicy?.patientDelivery || 'both',
				afterHoursPharmacyDelivery: pharmacy.afterHoursPolicy?.pharmacyDelivery || 'both',
				patientMessageTemplate: pharmacy.afterHoursContacts?.patientMessageTemplate || '',
				pharmacySmsRecipientsText: Array.isArray(pharmacy.afterHoursContacts?.pharmacySmsRecipients)
					? pharmacy.afterHoursContacts.pharmacySmsRecipients.join('\n')
					: '',
				pharmacyEmailRecipientsText: Array.isArray(pharmacy.afterHoursContacts?.pharmacyEmailRecipients)
					? pharmacy.afterHoursContacts.pharmacyEmailRecipients.join('\n')
					: '',
				// @ts-ignore
				memberList: pharmacyData.members || [],
			});
		}
	}, [pharmacyData, reset, detectedTimezone]);

	const onSubmit = async (data: any) => {
		const voiceInboundNumber = data.voiceInboundNumber ? String(data.voiceInboundNumber).trim() : null;
		const timezone = data.timezone ? String(data.timezone).trim() : null;
		const updateData = {
			name: data.name,
			active: data.active,
			voiceInboundNumber,
			timezone,
			operatingHours: data.operatingHours,
			afterHoursPolicy: {
				patientDelivery: data.afterHoursPatientDelivery,
				pharmacyDelivery: data.afterHoursPharmacyDelivery,
			},
			afterHoursContacts: {
				patientMessageTemplate: data.patientMessageTemplate ? String(data.patientMessageTemplate).trim() : '',
				pharmacySmsRecipients: parseRecipientText(data.pharmacySmsRecipientsText),
				pharmacyEmailRecipients: parseRecipientText(data.pharmacyEmailRecipientsText),
			},
		};

		try {
			if (id) {
				await updatePharmacy({
					pharmacyId: id,
					updateData,
				});

				const initialMembers = pharmacyData?.members || [];
				const currentMembers = data.memberList || [];

				const addedMembers = currentMembers.filter((cm: any) => !initialMembers.find((im: any) => im.userId === cm.userId));
				for (const member of addedMembers) {
					await inviteMember({ pharmacyId: id, username: member.username, roles: member.roles });
				}

				const removedMembers = initialMembers.filter((im: any) => !currentMembers.find((cm: any) => cm.userId === im.userId));
				for (const member of removedMembers) {
					await removeMember({ pharmacyId: id, userId: (member as any).userId });
				}

				for (const currentMember of currentMembers) {
					const initialMember = initialMembers.find((im: any) => im.userId === currentMember.userId);
					if (initialMember) {
						const initialRole = initialMember.roles?.[0];
						const currentRole = currentMember.roles?.[0];
						if (initialRole !== currentRole) {
							await updateMember({ pharmacyId: id, userId: currentMember.userId, roles: currentMember.roles });
						}
					}
				}

				dispatchToastMessage({ type: 'success', message: t('Saved') });
			} else {
				const result = await createPharmacy({
					name: data.name,
					slug: data.slug,
					active: data.active,
					voiceInboundNumber,
					timezone,
					operatingHours: data.operatingHours,
					afterHoursPolicy: updateData.afterHoursPolicy,
					afterHoursContacts: updateData.afterHoursContacts,
				});

				const createdPharmacyId = result?.pharmacy?._id;
				const currentMembers = data.memberList || [];
				if (createdPharmacyId && currentMembers.length) {
					for (const member of currentMembers) {
						await inviteMember({ pharmacyId: createdPharmacyId, username: member.username, roles: member.roles });
					}
				}

				dispatchToastMessage({ type: 'success', message: t('Saved') });
				// @ts-ignore
				router.navigate(`/admin/pharmacies/edit/${result.pharmacy._id}`);
			}
			queryClient.invalidateQueries({ key: ['medsense-pharmacies'] });
			if (id) {
				queryClient.invalidateQueries({ key: ['medsense-pharmacy', id] });
			}
		} catch (error: any) {
			dispatchToastMessage({ type: 'error', message: error });
			console.error(error);
		}
	};

	const nameId = useUniqueId();
	const slugId = useUniqueId();
	const activeId = useUniqueId();
	const voiceInboundNumberId = useUniqueId();
	const timezoneId = useUniqueId();
	const patientTemplateId = useUniqueId();
	const pharmacySmsRecipientsId = useUniqueId();
	const pharmacyEmailRecipientsId = useUniqueId();

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={id ? t('Edit_Pharmacy') : t('Create_Pharmacy')}>
					<ButtonGroup>
						<Button onClick={() => router.navigate('/admin/pharmacies')}>{t('Cancel')}</Button>
						<Button primary onClick={handleSubmit(onSubmit)} disabled={!isDirty}>
							{t('Save')}
						</Button>
					</ButtonGroup>
				</PageHeader>
				<PageScrollableContentWithShadow>
					<FieldGroup maxWidth='x600' w='full' alignSelf='center'>
						<Field>
							<FieldLabel htmlFor={nameId}>{t('Name')}</FieldLabel>
							<FieldRow>
								<Controller
									name='name'
									control={control}
									rules={{ required: true }}
									render={({ field }) => <TextInput {...field} id={nameId} />}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel htmlFor={slugId}>{t('Unique_Identifier')}</FieldLabel>
							<FieldRow>
								<Controller
									name='slug'
									control={control}
									rules={{ required: true, pattern: /^[a-z0-9-]+$/ }}
									render={({ field }) => <TextInput {...field} id={slugId} placeholder={t('Auto_generated')} />}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel htmlFor={activeId}>{t('Active')}</FieldLabel>
							<FieldRow>
								<Controller
									name='active'
									control={control}
									render={({ field: { value, onChange } }) => <ToggleSwitch id={activeId} checked={value} onChange={onChange} />}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel htmlFor={voiceInboundNumberId}>Voice Inbound Number (E.164)</FieldLabel>
							<FieldRow>
								<Controller
									name='voiceInboundNumber'
									control={control}
									render={({ field }) => <TextInput {...field} id={voiceInboundNumberId} placeholder='+15551234567' />}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel htmlFor={timezoneId}>Timezone</FieldLabel>
							<FieldRow>
								<Controller
									name='timezone'
									control={control}
									render={({ field }) => <TextInput {...field} id={timezoneId} placeholder='America/Toronto' />}
								/>
							</FieldRow>
						</Field>

						<Divider />
						<Box fontScale='p2m' mbe='x8'>Operating Hours</Box>
						{WEEKDAY_KEYS.map((day) => (
							<Box key={day} pbe='x8'>
								<Field>
									<FieldLabel>{day.charAt(0).toUpperCase() + day.slice(1)}</FieldLabel>
									<FieldRow>
										<Controller
											name={`operatingHours.${day}.enabled`}
											control={control}
											render={({ field: { value, onChange } }) => <ToggleSwitch checked={Boolean(value)} onChange={onChange} />}
										/>
										<Box mi='x8'>Open</Box>
										<Controller
											name={`operatingHours.${day}.start`}
											control={control}
											render={({ field }) => <TextInput {...field} type='time' disabled={!watch(`operatingHours.${day}.enabled`)} />}
										/>
										<Box mi='x8'>to</Box>
										<Controller
											name={`operatingHours.${day}.end`}
											control={control}
											render={({ field }) => <TextInput {...field} type='time' disabled={!watch(`operatingHours.${day}.enabled`)} />}
										/>
									</FieldRow>
								</Field>
							</Box>
						))}

						<Divider />
						<Box fontScale='p2m' mbe='x8'>After-Hours Handling</Box>
						<Field>
							<FieldLabel>Patient Delivery</FieldLabel>
							<FieldRow>
								<Controller
									name='afterHoursPatientDelivery'
									control={control}
									render={({ field }) => (
										<select value={field.value} onChange={field.onChange}>
											{CHANNEL_OPTIONS.map((option) => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</select>
									)}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel>Pharmacy Delivery</FieldLabel>
							<FieldRow>
								<Controller
									name='afterHoursPharmacyDelivery'
									control={control}
									render={({ field }) => (
										<select value={field.value} onChange={field.onChange}>
											{CHANNEL_OPTIONS.map((option) => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</select>
									)}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel htmlFor={patientTemplateId}>Patient After-Hours Message Template</FieldLabel>
							<FieldRow>
								<Controller
									name='patientMessageTemplate'
									control={control}
									render={({ field }) => (
										<TextInput
											{...field}
											id={patientTemplateId}
											placeholder='Thank you for calling {{pharmacyName}}. We received your message and will follow up during operating hours.'
										/>
									)}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel htmlFor={pharmacySmsRecipientsId}>Pharmacy SMS Recipients</FieldLabel>
							<FieldRow>
								<Controller
									name='pharmacySmsRecipientsText'
									control={control}
									render={({ field }) => <TextInput {...field} id={pharmacySmsRecipientsId} placeholder='+15551234567, +15557654321' />}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel htmlFor={pharmacyEmailRecipientsId}>Pharmacy Email Recipients</FieldLabel>
							<FieldRow>
								<Controller
									name='pharmacyEmailRecipientsText'
									control={control}
									render={({ field }) => <TextInput {...field} id={pharmacyEmailRecipientsId} placeholder='oncall@example.com, manager@example.com' />}
								/>
							</FieldRow>
						</Field>

						<Divider />
						<Field>
							<FieldLabel>{t('Members')}</FieldLabel>
							<PharmacyMembersTable control={control} register={register} />
						</Field>
					</FieldGroup>
				</PageScrollableContentWithShadow>
			</Page>
		</Page>
	);
};

export default EditPharmacy;
