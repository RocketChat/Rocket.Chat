import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

type NewMessagesButtonProps = {
	visible: boolean;
	onClick: () => void;
};

const NewMessagesButton = ({ visible, onClick }: NewMessagesButtonProps): ReactElement => {
	const t = useTranslation();

	return (
		<button
			className={`new-message background-primary-action-color color-content-background-color ${visible ? '' : 'not'}`}
			onClick={onClick}
		>
			<i className='icon-down-big' />
			{t('New_messages')}
		</button>
	);
};

export default NewMessagesButton;
