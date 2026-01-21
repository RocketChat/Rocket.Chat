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
import { useUniqueId, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { Page, PageHeader, PageScrollableContentWithShadow } from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint, useToastMessageDispatch, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';

import PharmacyMembersTable from './PharmacyMembersTable/PharmacyMembersTable';

const EditPharmacy = ({ id }: { id?: string }) => {
    const t = useTranslation();
    const dispatchToastMessage = useToastMessageDispatch();
    const router = useRouter();
    const queryClient = useQueryClient();

    const { control, handleSubmit, reset, register, setValue, watch, formState: { isDirty, isValid } } = useForm({
        defaultValues: {
            name: '',
            slug: '',
            active: true,
            memberList: [],
        },
    });

    // Auto-generate slug
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

    const { data: pharmacyData, isLoading } = useQuery({
        queryKey: ['medsense-pharmacy', id],
        queryFn: async () => {
            if (!id) return null;
            const { pharmacy } = await getPharmacyInfo({ pharmacyId: id });

            let members = [];
            if (pharmacy) {
                const membersResult = await getMembers({ pharmacyId: id });
                // @ts-ignore
                members = membersResult.members.map(m => ({
                    userId: m.userId,
                    username: m.user?.username,
                    name: m.user?.name,
                    roles: m.roles
                }));
            }
            return { pharmacy, members };
        },
        enabled: !!id,
    });

    React.useEffect(() => {
        if (pharmacyData?.pharmacy) {
            reset({
                name: pharmacyData.pharmacy.name,
                slug: pharmacyData.pharmacy.slug,
                active: pharmacyData.pharmacy.active,
                // @ts-ignore
                memberList: pharmacyData.members || [],
            });
        }
    }, [pharmacyData, reset]);

    const onSubmit = async (data: any) => {
        try {
            if (id) {
                // Update basic info
                await updatePharmacy({
                    pharmacyId: id,
                    updateData: {
                        name: data.name,
                        active: data.active,
                    },
                });

                // Diff members
                const initialMembers = pharmacyData?.members || [];
                const currentMembers = data.memberList || [];

                // Add new members
                const addedMembers = currentMembers.filter((cm: any) => !initialMembers.find((im: any) => im.userId === cm.userId));
                for (const member of addedMembers) {
                    await inviteMember({ pharmacyId: id, username: member.username, roles: member.roles });
                }

                // Remove deleted members
                const removedMembers = initialMembers.filter((im: any) => !currentMembers.find((cm: any) => cm.userId === im.userId));
                for (const member of removedMembers) {
                    await removeMember({ pharmacyId: id, userId: (member as any).userId });
                }

                dispatchToastMessage({ type: 'success', message: t('Saved') });
            } else {
                const result = await createPharmacy({
                    name: data.name,
                    slug: data.slug,
                    active: data.active
                });

                // For new pharmacy, we can add members immediately after creation if needed, 
                // but usually simpler to redirect to edit first.
                // Assuming basic creation for now.

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
                                    render={({ field: { value, onChange } }) => (
                                        <ToggleSwitch id={activeId} checked={value} onChange={onChange} />
                                    )}
                                />
                            </FieldRow>
                        </Field>

                        {id && (
                            <>
                                <Divider />
                                <Field>
                                    <FieldLabel>{t('Members')}</FieldLabel>
                                    <PharmacyMembersTable control={control} register={register} />
                                </Field>
                            </>
                        )}
                    </FieldGroup>
                </PageScrollableContentWithShadow>
            </Page>
        </Page>
    );
};

export default EditPharmacy;
