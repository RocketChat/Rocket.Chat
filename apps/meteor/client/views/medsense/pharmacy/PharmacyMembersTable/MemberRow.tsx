import { GenericTableRow, GenericTableCell } from '@rocket.chat/ui-client';
import React, { memo } from 'react';
import type { UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from '@rocket.chat/fuselage';

type MemberRowProps = {
    member: { userId: string; username: string; name?: string; roles: string[] };
    index: number;
    // register: UseFormRegister<any>; // Potentially for roles if editable
    onRemove: (userId: string) => void;
};

const MemberRow = ({ index, member, onRemove }: MemberRowProps) => {
    const { t } = useTranslation();

    return (
        <GenericTableRow key={member.userId} tabIndex={0}>
            <GenericTableCell withTruncatedText>
                {member.username}
            </GenericTableCell>
            <GenericTableCell withTruncatedText>
                {member.name}
            </GenericTableCell>
            <GenericTableCell withTruncatedText>
                {member.roles.join(', ')}
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
