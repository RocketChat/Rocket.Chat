import { GenericTableRow, GenericTableCell } from '@rocket.chat/ui-client';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon, Select } from '@rocket.chat/fuselage';

type MemberRowProps = {
    member: { userId: string; username: string; name?: string; roles: string[] };
    index: number;
    onRemove: (userId: string) => void;
    onRoleChange?: (userId: string, newRole: string) => void;
};

const MemberRow = ({ index, member, onRemove, onRoleChange }: MemberRowProps) => {
    const { t } = useTranslation();

    const roleOptions: [string, string][] = [
        ['owner', t('Owner')],
        ['manager', t('Manager')],
        ['staff', t('Staff')],
    ];

    const currentRole = member.roles[0] || 'staff';

    const handleRoleChange = (value: string | number | undefined) => {
        if (onRoleChange && value) {
            onRoleChange(member.userId, String(value));
        }
    };

    return (
        <GenericTableRow key={member.userId} tabIndex={0}>
            <GenericTableCell withTruncatedText>
                {member.username}
            </GenericTableCell>
            <GenericTableCell withTruncatedText>
                {member.name}
            </GenericTableCell>
            <GenericTableCell>
                {onRoleChange ? (
                    <Select
                        options={roleOptions}
                        value={currentRole}
                        onChange={handleRoleChange}
                    />
                ) : (
                    member.roles.join(', ')
                )}
            </GenericTableCell>
            <GenericTableCell fontScale='p2' color='hint' w='x60' display='flex' justifyContent='flex-end'>
                <Button small danger onClick={() => onRemove(member.userId)}>
                    <Icon name='trash' />
                </Button>
            </GenericTableCell>
        </GenericTableRow>
    );
};
export default memo(MemberRow);
