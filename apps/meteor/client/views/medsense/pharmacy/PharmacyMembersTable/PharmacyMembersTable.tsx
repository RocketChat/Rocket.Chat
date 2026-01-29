import { Pagination } from '@rocket.chat/fuselage';
import { GenericTable, GenericTableBody, GenericTableHeader, GenericTableHeaderCell, usePagination } from '@rocket.chat/ui-client';
import React, { useMemo } from 'react';
import type { Control, UseFormRegister } from 'react-hook-form';
import { useWatch, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import AddMember from './AddMember';
import MemberRow from './MemberRow';

type PharmacyMembersTableProps = {
    control: Control<any>;
    register: UseFormRegister<any>;
};

const PharmacyMembersTable = ({ control, register }: PharmacyMembersTableProps) => {
    const { t } = useTranslation();
    const { fields, append, remove, update } = useFieldArray({ control, name: 'memberList' });
    const memberList = useWatch({ control, name: 'memberList' });

    const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
    const page = useMemo(() => fields.slice(current, current + itemsPerPage), [current, fields, itemsPerPage]);

    // Helper to remove by finding index
    const handleRemove = (userId: string) => {
        const index = fields.findIndex((f: any) => f.userId === userId);
        if (index > -1) {
            remove(index);
        }
    };

    // Helper to update role
    const handleRoleChange = (userId: string, newRole: string) => {
        const index = fields.findIndex((f: any) => f.userId === userId);
        if (index > -1) {
            const currentMember = memberList[index];
            update(index, { ...currentMember, roles: [newRole] });
        }
    };

    return (
        <>
            <AddMember memberList={memberList || []} onAdd={append} />

            <GenericTable>
                <GenericTableHeader>
                    <GenericTableHeaderCell>{t('Username')}</GenericTableHeaderCell>
                    <GenericTableHeaderCell>{t('Name')}</GenericTableHeaderCell>
                    <GenericTableHeaderCell>{t('Roles')}</GenericTableHeaderCell>
                    <GenericTableHeaderCell w='x60'>{t('Remove')}</GenericTableHeaderCell>
                </GenericTableHeader>

                <GenericTableBody>
                    {page.map((member: any, index: number) => (
                        <MemberRow key={member.id} index={index} member={member} onRemove={handleRemove} onRoleChange={handleRoleChange} />
                    ))}
                </GenericTableBody>
            </GenericTable>

            <Pagination
                divider
                current={current}
                itemsPerPage={itemsPerPage}
                count={fields.length}
                onSetItemsPerPage={onSetItemsPerPage}
                onSetCurrent={onSetCurrent}
                {...paginationProps}
            />
        </>
    );
};

export default PharmacyMembersTable;
