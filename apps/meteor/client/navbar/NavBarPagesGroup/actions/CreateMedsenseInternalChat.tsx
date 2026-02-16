import {
    Box,
    Modal,
    Button,
    FieldGroup,
    Field,
    FieldRow,
    FieldLabel,
    Select,
    Chip,
    AutoComplete,
    Option,
    ModalHeader,
    ModalTitle,
    ModalClose,
    ModalContent,
    ModalFooter,
    ModalFooterControllers,
} from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useId, memo, useState, useMemo, useCallback } from 'react';

import { goToRoomById } from '../../../lib/utils/goToRoomById';

type CreateMedsenseInternalChatProps = { onClose: () => void };

const CreateMedsenseInternalChat = ({ onClose }: CreateMedsenseInternalChatProps) => {
    const t = useTranslation();
    const formId = useId();
    const dispatchToastMessage = useToastMessageDispatch();
    const [selectedPharmacy, setSelectedPharmacy] = useState<string>('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [filter, setFilter] = useState('');
    const debouncedFilter = useDebouncedValue(filter, 300);

    // Fetch user's pharmacies
    const getPharmacies = useEndpoint('GET', '/v1/medsense/pharmacies.list');
    const { data: pharmaciesData } = useQuery({
        queryKey: ['medsense-pharmacies-list'],
        queryFn: async () => getPharmacies({}),
    });

    const pharmacyOptions = useMemo(() => {
        if (!pharmaciesData?.pharmacies) return [];
        return pharmaciesData.pharmacies.map((p: any) => [p._id, p.name] as [string, string]);
    }, [pharmaciesData]);

    // Use the NEW pharmacy-filtered users.autocomplete API
    const getUsersAutocomplete = useEndpoint('GET', '/v1/medsense/users.autocomplete');
    const { data: usersData } = useQuery({
        queryKey: ['medsense-users-autocomplete', selectedPharmacy, debouncedFilter],
        queryFn: async () => getUsersAutocomplete({ pharmacyId: selectedPharmacy, term: debouncedFilter }),
        enabled: !!selectedPharmacy,
    });

    const userOptions = useMemo(() => {
        if (!usersData?.items) return [];
        return usersData.items.map((u: any) => ({
            value: u.username,
            label: u.name || u.username,
        }));
    }, [usersData]);

    const createDirectAction = useEndpoint('POST', '/v1/dm.create');

    const mutateDirectMessage = useMutation({
        mutationFn: createDirectAction,
        onSuccess: ({ room: { rid } }) => {
            goToRoomById(rid);
        },
        onError: (error) => {
            dispatchToastMessage({ type: 'error', message: error });
        },
        onSettled: () => {
            onClose();
        },
    });

    const handleCreate = () => {
        if (selectedUsers.length === 0) return;
        mutateDirectMessage.mutate({ usernames: selectedUsers.join(',') });
    };

    const handleChange = useCallback((value: string | string[]) => {
        if (Array.isArray(value)) {
            setSelectedUsers(value);
            return;
        }
        setSelectedUsers(value ? [value] : []);
    }, []);

    return (
        <Modal aria-labelledby={`${formId}-title`}>
            <ModalHeader>
                <ModalTitle id={`${formId}-title`}>{t('Medsense_Internal_Chat')}</ModalTitle>
                <ModalClose tabIndex={-1} onClick={onClose} />
            </ModalHeader>
            <ModalContent mbe={2}>
                <FieldGroup>
                    <Field>
                        <FieldLabel>{t('Pharmacy')}</FieldLabel>
                        <FieldRow>
                            <Select
                                value={selectedPharmacy}
                                onChange={(val) => {
                                    setSelectedPharmacy(val as string);
                                    setSelectedUsers([]); // Clear users when pharmacy changes
                                }}
                                options={pharmacyOptions}
                                placeholder={t('Select_Pharmacy')}
                            />
                        </FieldRow>
                    </Field>
                    <Field>
                        <FieldLabel>{t('Members')}</FieldLabel>
                        <FieldRow>
                            <AutoComplete
                                value={selectedUsers}
                                onChange={handleChange}
                                filter={filter}
                                setFilter={setFilter}
                                options={userOptions}
                                disabled={!selectedPharmacy}
                                placeholder={selectedPharmacy ? t('Search_users') : t('Select_pharmacy_first')}
                                multiple
                                renderSelected={({ selected: { value, label }, onRemove, ...props }: any) => (
                                    <Chip {...props} key={value} value={value} onClick={onRemove} mie='x4'>
                                        <Box is='span' margin='none' mis={4}>
                                            {label || value}
                                        </Box>
                                    </Chip>
                                )}
                                renderItem={({ value, label, ...props }: any) => (
                                    <Option key={value} {...props} label={label} />
                                )}
                            />
                        </FieldRow>
                        {!selectedPharmacy && (
                            <Box color='hint' fontScale='c1' mbs='x4'>
                                {t('Select_pharmacy_to_filter_users')}
                            </Box>
                        )}
                    </Field>
                </FieldGroup>
            </ModalContent>
            <ModalFooter>
                <ModalFooterControllers>
                    <Button onClick={onClose}>{t('Cancel')}</Button>
                    <Button
                        loading={mutateDirectMessage.isLoading}
                        onClick={handleCreate}
                        primary
                        disabled={!selectedPharmacy || selectedUsers.length === 0}
                    >
                        {t('Create')}
                    </Button>
                </ModalFooterControllers>
            </ModalFooter>
        </Modal>
    );
};

export default memo(CreateMedsenseInternalChat);
