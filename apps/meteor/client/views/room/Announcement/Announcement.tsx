import { Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import AnnouncementComponent from './AnnouncementComponent';
import GenericModal from '../../../components/GenericModal';
import MarkdownText from '../../../components/MarkdownText';

type AnnouncementProps = {
	announcement: string;
	announcementDetails?: () => void;
};

const Announcement = ({ announcement, announcementDetails }: AnnouncementProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const closeModal = useEffectEvent(() => setModal(null));
	const handleClick = (e: MouseEvent<HTMLAnchorElement>): void => {
		if ((e.target as HTMLAnchorElement).href) {
			return;
		}

		if (window?.getSelection()?.toString() !== '') {
			return;
		}

		announcementDetails
			? announcementDetails()
			: setModal(
					<GenericModal icon={null} title={t('Announcement')} confirmText={t('Close')} onConfirm={closeModal} onClose={closeModal}>
						<Box overflow='hidden' wordBreak='break-word'>
							<MarkdownText content={announcement} parseEmoji />
						</Box>
					</GenericModal>,
				);
	};

	return announcement ? (
		<AnnouncementComponent onClickOpen={(e: MouseEvent<HTMLAnchorElement>): void => handleClick(e)}>
			<MarkdownText variant='inlineWithoutBreaks' content={announcement} withTruncatedText parseEmoji />
		</AnnouncementComponent>
	) : null;
};

export default Announcement;
