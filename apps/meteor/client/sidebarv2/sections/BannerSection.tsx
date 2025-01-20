import { useSessionStorage } from '@rocket.chat/fuselage-hooks';
import { useRole, useSetting } from '@rocket.chat/ui-contexts';

import AirGappedRestrictionBanner from './AirGappedRestrictionBanner/AirGappedRestrictionBanner';
import StatusDisabledBanner from './StatusDisabledBanner';
import { useAirGappedRestriction } from '../../hooks/useAirGappedRestriction';

const BannerSection = () => {
	const [isRestricted, isWarning, remainingDays] = useAirGappedRestriction();
	const isAdmin = useRole('admin');

	const [bannerDismissed, setBannerDismissed] = useSessionStorage('presence_cap_notifier', false);
	const presenceDisabled = useSetting('Presence_broadcast_disabled', false);

	if ((isWarning || isRestricted) && isAdmin) {
		return <AirGappedRestrictionBanner isRestricted={isRestricted} remainingDays={remainingDays} />;
	}

	if (presenceDisabled && !bannerDismissed) {
		return <StatusDisabledBanner onDismiss={() => setBannerDismissed(true)} />;
	}

	return null;
};

export default BannerSection;
