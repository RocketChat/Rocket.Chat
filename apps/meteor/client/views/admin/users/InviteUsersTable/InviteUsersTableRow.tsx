import type { IUser } from '@rocket.chat/core-typings';
import { Box, Menu, Option } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';

import { GenericTableRow, GenericTableCell } from '../../../../components/GenericTable';
import { useMessageDateFormatter } from '../../../../components/message/list/MessageListContext';
import type { Action } from '../../../hooks/useActionSpread';
import { useDeleteInviteRecordAction } from '../hooks/useDeleteInviteRecordAction';
import { useResendInviteAction } from '../hooks/useResendInviteAction';
import { useRevokeInviteAction } from '../hooks/useRevokeInviteAction';

type UsersTableRowProps = {
	user: Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'emails' | 'active' | 'avatarETag' | 'roles'>;
	onClick: (id: IUser['_id'], e: React.MouseEvent<HTMLElement, MouseEvent> | React.KeyboardEvent<HTMLElement>) => void;
	mediaQuery: boolean;
	refetchUsers: ReturnType<typeof useQuery>['refetch'];
	onReload: () => void;
};

const UsersTableRow = ({ user, onClick, mediaQuery, onReload }: UsersTableRowProps): ReactElement => {
	const t = useTranslation();
	const { _id, emails } = user;

	// TODO: create endpoint to return invite status and type
	const inviteStatus: 'Pending' | 'Accepted' | 'Expired' = 'Pending';
	const inviteType: 'email' | 'link' = 'link';
	const inviteDate = new Date();

	// TODO: get this data from seats available?
	const currentUsage = 0;
	const maxUsageAllowance: number | 'Unlimited' = 'Unlimited';

	/*
	const onChange = useMutableCallback(() => {
		onReload();
		refetchUsers();
	});
	*/

	// TODO: fix params
	const resendInviteAction: Action | undefined = useResendInviteAction(onReload);
	const revokeInviteAction: Action | undefined = useRevokeInviteAction(onReload);
	const deleteInviteRecordAction: Action | undefined = useDeleteInviteRecordAction(onReload);

	const menuOptions = {
		...(resendInviteAction &&
			inviteStatus === 'Pending' && {
				resend: { label: { label: resendInviteAction.label, icon: resendInviteAction.icon }, action: resendInviteAction.action },
			}),
		...(revokeInviteAction &&
			(inviteStatus === 'Pending' || inviteStatus === 'Accepted') && {
				revoke: { label: { label: revokeInviteAction.label, icon: revokeInviteAction.icon }, action: revokeInviteAction.action },
			}),
		...(deleteInviteRecordAction && {
			delete: {
				label: { label: deleteInviteRecordAction.label, icon: deleteInviteRecordAction.icon },
				action: deleteInviteRecordAction.action,
			},
		}),
	};

	const formatter = useMessageDateFormatter();

	return (
		<GenericTableRow
			onKeyDown={(e): void => onClick(_id, e)}
			onClick={(e): void => onClick(_id, e)}
			tabIndex={0}
			role='link'
			action
			qa-user-id={_id}
		>
			{mediaQuery && (
				<GenericTableCell>
					<Box fontScale='p2m' color='hint' withTruncatedText>
						{t(inviteType)}
					</Box>
					<Box mi={4} />
				</GenericTableCell>
			)}

			<GenericTableCell withTruncatedText>{emails?.length && emails[0].address}</GenericTableCell>

			<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
				{formatter(inviteDate)}
			</GenericTableCell>

			{mediaQuery && (
				<GenericTableCell>
					<Box fontScale='p2m' color='hint' withTruncatedText>
						{t(inviteStatus)}
					</Box>
					<Box mi={4} />
				</GenericTableCell>
			)}

			{mediaQuery && (
				<GenericTableCell>
					<Box fontScale='p2m' color='hint' withTruncatedText>
						{`${currentUsage} / ${maxUsageAllowance === 'Unlimited' ? t(maxUsageAllowance) : maxUsageAllowance}`}
					</Box>
					<Box mi={4} />
				</GenericTableCell>
			)}

			<GenericTableCell
				display='flex'
				justifyContent='flex-end'
				onClick={(e): void => {
					e.stopPropagation();
				}}
			>
				<Menu
					mi={4}
					placement='bottom-start'
					flexShrink={0}
					key='menu'
					renderItem={({ label: { label, icon }, ...props }): ReactElement =>
						label === 'Delete' ? (
							<Option label={label} title={label} icon={icon} variant='danger' {...props} />
						) : (
							<Option label={label} title={label} icon={icon} {...props} />
						)
					}
					options={menuOptions}
				/>
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default UsersTableRow;
