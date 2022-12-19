import type { IMessage } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { openUserCard } from '../../../../../app/ui/client/lib/UserCard';
import GenericModal from '../../../../components/GenericModal';
import type { ToolboxContextValue } from '../../contexts/ToolboxContext';
import Reactions from './Reactions';

type ReactionListProps = {
	rid: string;
	reactions: Required<IMessage>['reactions'];
	tabBar: ToolboxContextValue;
	onClose: () => void;
};

const ReactionList = ({ rid, reactions, tabBar, onClose }: ReactionListProps): ReactElement => {
	const t = useTranslation();

	const onClick = useMutableCallback((e) => {
		const { username } = e.currentTarget.dataset;

		if (!username) {
			return;
		}

		openUserCard({
			username,
			rid,
			target: e.currentTarget,
			open: (e: React.MouseEvent<HTMLElement>) => {
				e.preventDefault();
				onClose();
				tabBar.openRoomInfo(username);
			},
		});
	});

	return (
		<GenericModal variant='info' title={t('Users_reacted')} onClose={onClose} onConfirm={onClose}>
			<Reactions reactions={reactions} onClick={onClick} />
		</GenericModal>
	);
};

export default ReactionList;
