import type { AllHTMLAttributes } from 'react';

import Away from './icons/Away';
import Busy from './icons/Busy';
import Disabled from './icons/Disabled';
import Loading from './icons/Loading';
import Offline from './icons/Offline';
import Online from './icons/Online';

export type StatusBulletProps = {
	/** The user's status; `loading` while it isn't known yet. */
	status?: 'loading' | 'online' | 'busy' | 'away' | 'offline' | 'disabled';
	/** `'large'` renders the same as the default size and is deprecated. */
	size?: 'small' | 'large';
} & Omit<AllHTMLAttributes<SVGElement>, 'size'>;

/** Shows a user's status with a round icon whose color and shape both change with it, so color is never the only cue. */
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

export default StatusBullet;
