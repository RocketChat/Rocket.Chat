import { Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { AnnouncementBanner } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { KeyboardEvent, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../components/GenericModal';
import MarkdownText from '../../../components/MarkdownText';

type RoomAnnouncementParams = {
	announcement: string;
};

const RoomAnnouncement = ({ announcement }: RoomAnnouncementParams) => {
	const { t } = useTranslation();
	const setModal = useSetModal();

	const handleOpenAnnouncement = useEffectEvent(() => {
		setModal(
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
	});

	const handleClick = (e: MouseEvent) => {
		if ((e.target as HTMLAnchorElement).href) {
			return;
		}

		if (window?.getSelection()?.toString() !== '') {
			return;
		}

		handleOpenAnnouncement();
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if ((e.target as HTMLAnchorElement).href) {
			return;
		}

		if (e.code === 'Enter' || e.code === 'Space') {
			e.preventDefault();
			handleOpenAnnouncement();
		}
	};

	return announcement ? (
		<AnnouncementBanner onClick={handleClick} onKeyDown={handleKeyDown}>
			<MarkdownText variant='inlineWithoutBreaks' content={announcement} withTruncatedText parseEmoji />
		</AnnouncementBanner>
	) : null;
};

export default RoomAnnouncement;
