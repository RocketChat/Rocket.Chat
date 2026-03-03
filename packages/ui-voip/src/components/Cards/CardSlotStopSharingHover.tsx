import { Button } from "@rocket.chat/fuselage";
import CardSlotHover from "./CardSlotHover";
import { useTranslation } from "react-i18next";

type CardSlotStopSharingHoverProps = {
    onClick: () => void;
};

const CardSlotStopSharingHover = ({ onClick }: CardSlotStopSharingHoverProps) => {
    const { t } = useTranslation();
	return <CardSlotHover>
        {/* // TODO: use fuselage `desktop-cross` when available */}
        <Button danger small icon='desktop' onClick={onClick}>{t('Stop_sharing')}</Button>
	</CardSlotHover>;
};

export default CardSlotStopSharingHover;