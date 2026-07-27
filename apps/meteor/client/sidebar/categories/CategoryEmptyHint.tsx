import { Box, Button } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import ManageCategoryChannelsModal from './ManageCategoryChannelsModal';

type CategoryEmptyHintProps = {
	categoryId: string;
	categoryName: string;
};

const CategoryEmptyHint = ({ categoryId, categoryName }: CategoryEmptyHintProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();

	const openManage = (): void => {
		const closeModal = (): void => setModal(null);
		setModal(<ManageCategoryChannelsModal categoryId={categoryId} categoryName={categoryName} onClose={closeModal} />);
	};

	return (
		<Box
			mi={8}
			mbe={4}
			p={12}
			borderWidth='default'
			borderStyle='dashed'
			borderColor='extra-light'
			borderRadius='x4'
			display='flex'
			flexDirection='column'
			alignItems='flex-start'
		>
			<Box fontScale='c1' color='hint' mbe={8}>
				{t('No_channels_yet')}
			</Box>
			<Button small secondary onClick={openManage}>
				{t('Manage_channels')}
			</Button>
		</Box>
	);
};

export default CategoryEmptyHint;
