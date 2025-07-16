import type { IRoom, IUser } from '@rocket.chat/core-typings';
import {
	Option,
	OptionAvatar,
	OptionColumn,
	OptionDescription,
	OptionMenu,
	OptionContent,
	Icon,
	IconButton,
	OptionSkeleton,
} from '@rocket.chat/fuselage';
import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { ReactElement, MouseEvent } from 'react';
import { useState } from 'react';

import UserActions from './RoomMembersActions';
import { getUserDisplayNames } from '../../../../../lib/getUserDisplayNames';
import { ReactiveUserStatus } from '../../../../components/UserStatus';
import { usePreventPropagation } from '../../../../hooks/usePreventPropagation';

type RoomMembersItemProps = {
	onClickView: (e: MouseEvent<HTMLElement>) => void;
	rid: IRoom['_id'];
	reload: () => void;
	useRealName: boolean;
} & Pick<IUser, 'federated' | 'username' | 'name' | '_id' | 'freeSwitchExtension'>;

const RoomMembersItem = ({
	_id,
	name,
	username,
	federated,
	freeSwitchExtension,
	onClickView,
	rid,
	reload,
	useRealName,
}: RoomMembersItemProps): ReactElement => {
	const [showButton, setShowButton] = useState();

	const isReduceMotionEnabled = usePrefersReducedMotion();
	const handleMenuEvent = {
		[isReduceMotionEnabled ? 'onMouseEnter' : 'onTransitionEnd']: setShowButton,
	};

	const preventPropagation = usePreventPropagation();

	const [nameOrUsername, displayUsername] = getUserDisplayNames(name, username, useRealName);

	return (
		<Option data-username={username} data-userid={_id} onClick={onClickView} style={{ paddingInline: 24 }} {...handleMenuEvent}>
			<OptionAvatar>
				<UserAvatar username={username || ''} size='x28' />
			</OptionAvatar>
			<OptionColumn>{federated ? <Icon name='globe' size='x16' /> : <ReactiveUserStatus uid={_id} />}</OptionColumn>
			<OptionContent data-qa={`MemberItem-${username}`}>
				{nameOrUsername} {displayUsername && <OptionDescription>({displayUsername})</OptionDescription>}
			</OptionContent>
			<OptionMenu onClick={preventPropagation}>
				{showButton ? (
					<UserActions username={username} name={name} rid={rid} _id={_id} freeSwitchExtension={freeSwitchExtension} reload={reload} />
				) : (
					<IconButton tiny icon='kebab' />
				)}
			</OptionMenu>
		</Option>
	);
};

export default Object.assign(RoomMembersItem, {
	Skeleton: OptionSkeleton,
});
