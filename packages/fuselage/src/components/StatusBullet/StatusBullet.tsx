import type { AllHTMLAttributes } from 'react';

import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import Away from './icons/Away';
import Busy from './icons/Busy';
import Disabled from './icons/Disabled';
import Loading from './icons/Loading';
import Offline from './icons/Offline';
import Online from './icons/Online';

export type StatusBulletProps = {
	status?: 'loading' | 'online' | 'busy' | 'away' | 'offline' | 'disabled';
	/** `'large'` renders the same as the default size and is deprecated. */
	size?: 'small' | 'large';
} & Omit<AllHTMLAttributes<SVGElement>, 'size'>;

/**
 * The `StatusBullet` is used to inform the user status.
 */
const StatusBullet = ({ status = 'loading', ...props }: StatusBulletProps) => {
	switch (status) {
		case 'online':
			return <Online {...props} />;
		case 'away':
			return <Away {...props} />;
		case 'busy':
			return <Busy {...props} />;
		case 'disabled':
			return <Disabled {...props} />;
		case 'offline':
			return <Offline {...props} />;
		default:
			return <Loading {...props} />;
	}
};

export default withFuselageProvider(StatusBullet);
