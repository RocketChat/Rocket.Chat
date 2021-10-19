import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement } from 'react';

import { openUserCard } from '../../../../../app/ui/client/lib/UserCard';
import { IUser } from '../../../../../definition/IUser';
import GenericModal from '../../../../components/GenericModal';
import { useTranslation } from '../../../../contexts/TranslationContext';
import Reactions from './Reactions';

type ReactionListProps = {
	rid: string;
	reactions: ReactElement;
	tabBar: {
		openUserInfo: (username: IUser['username']) => void;
	};
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
				tabBar.openUserInfo(username);
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
