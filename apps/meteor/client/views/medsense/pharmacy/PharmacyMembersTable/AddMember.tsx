import { Box, Button, Select } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { AriaAttributes } from 'react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useEndpointMutation } from '../../../../hooks/useEndpointMutation';
import { UserAutoComplete } from '@rocket.chat/ui-client';

type AddMemberProps = Pick<AriaAttributes, 'aria-labelledby'> & {
    memberList: { userId: string; username: string; name?: string; roles: string[] }[];
    onAdd: (member: { userId: string; username: string; name?: string; roles: string[] }) => void;
};

const AddMember = ({ memberList, onAdd, 'aria-labelledby': ariaLabelledBy }: AddMemberProps) => {
    const { t } = useTranslation();

    const [username, setUsername] = useState('');
    const [role, setRole] = useState('staff');

    const { mutateAsync: getUser } = useEndpointMutation('GET', '/v1/users.info', { keys: { username } });

    const dispatchToastMessage = useToastMessageDispatch();

    const handleUser = useEffectEvent((e: unknown) => {
        if (typeof e === 'string') {
            setUsername(e.trim());
        } else if (e && typeof e === 'object') {
            // @ts-ignore
            setUsername(String((e.username ?? e.value ?? '')).trim());
        }
    });

    const handleSave = useEffectEvent(async () => {
        if (!username) {
            return;
        }

        try {
            const { user } = await getUser({ username });

            // Use the info from the fetched user to ensure valid data
            if (!memberList.some(({ userId }) => userId === user._id)) {
                setUsername('');
                onAdd({ userId: user._id, username: user.username || '', name: user.name, roles: [role] });
                setRole('staff');
            } else {
                dispatchToastMessage({ type: 'error', message: t('User_already_member') });
            }
        } catch (error) {
            dispatchToastMessage({ type: 'error', message: t('User_not_found') });
        }
    });

    const roleOptions: [string, string][] = [
        ['manager', t('Manager')],
        ['staff', t('Staff')],
    ];

    return (
        <Box role='group' aria-labelledby={ariaLabelledBy} display='flex' flexWrap='wrap' alignItems='center' mb={8} gap='x8'>
            <Box flexGrow={1} minWidth='x200'>
                <UserAutoComplete value={username} onChange={handleUser} conditions={{ roles: { $ne: 'patient' } }} placeholder={t('Username')} />
            </Box>
            <Box minWidth='x140'>
                <Select options={roleOptions} value={role} onChange={(val) => setRole(String(val))} />
            </Box>
            <Button disabled={!username} onClick={handleSave} primary>
                {t('Add')}
            </Button>
        </Box>
    );
};

export default AddMember;
