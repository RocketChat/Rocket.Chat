import { Box } from '@rocket.chat/fuselage';
import { AnnouncementBanner } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { type MouseEvent, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../components/GenericModal';
import MarkdownText from '../../../components/MarkdownText';

type RoomAnnouncementParams = {
	announcement: string;
	announcementDetails?: () => void;
};

const RoomAnnouncement = ({ announcement, announcementDetails }: RoomAnnouncementParams) => {
	const { t } = useTranslation();
	const setModal = useSetModal();

	const handleOpenAnnouncement = useCallback(() => {
		announcementDetails
			? announcementDetails()
			: setModal(
					<GenericModal
						icon={null}
						title={t('Announcement')}
						confirmText={t('Close')}
						onConfirm={() => setModal(null)}
						onClose={() => setModal(null)}
					>
						<Box>
							<MarkdownText content={announcement} parseEmoji />
						</Box>
					</GenericModal>,
				);
	}, [announcement, announcementDetails, setModal, t]);

	const handleClick = (e: MouseEvent) => {
		if ((e.target as HTMLAnchorElement).href) {
			return;
		}

		if (window?.getSelection()?.toString() !== '') {
			return;
		}

		handleOpenAnnouncement();
	};

	return announcement ? (
		<AnnouncementBanner onClick={handleClick} onKeyDown={(e) => (e.code === 'Enter' || e.code === 'Space') && handleOpenAnnouncement()}>
			<MarkdownText variant='inlineWithoutBreaks' content={announcement} withTruncatedText parseEmoji />
		</AnnouncementBanner>
	) : null;
};

export default RoomAnnouncement;
