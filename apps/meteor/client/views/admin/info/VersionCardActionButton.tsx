import { Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRouter, type To, useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import RegisterWorkspaceModal from '../cloud/modals/RegisterWorkspaceModal';

export type ActionButton = {
	path: string;
	label: ReactElement;
};

type VersionCardActionButtonProps = {
	actionButton: ActionButton;
	refetch: () => void;
};

const VersionCardActionButton = ({ actionButton, refetch }: VersionCardActionButtonProps): ReactElement => {
	const router = useRouter();
	const setModal = useSetModal();

	const handleActionButton = useMutableCallback((path: string) => {
		if (path.startsWith('http')) {
			return window.open(path, '_blank');
		}

		if (path === 'modal#registerWorkspace') {
			handleRegisterWorkspaceClick();
			return;
		}

		router.navigate(path as To);
	});

	const handleRegisterWorkspaceClick = (): void => {
		const handleModalClose = (): void => {
			setModal(null);
			refetch();
		};
		setModal(<RegisterWorkspaceModal onClose={handleModalClose} onStatusChange={refetch} />);
	};

	return (
		<Button primary onClick={() => handleActionButton(actionButton.path)}>
			{actionButton.label}
		</Button>
	);
};

export default memo(VersionCardActionButton);
