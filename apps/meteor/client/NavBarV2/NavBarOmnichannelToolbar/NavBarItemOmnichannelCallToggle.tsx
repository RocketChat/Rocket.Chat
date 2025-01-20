import type { ComponentPropsWithoutRef } from 'react';

import NavBarItemOmnichannelCallToggleError from './NavBarItemOmnichannelCallToggleError';
import NavBarItemOmnichannelCallToggleLoading from './NavBarItemOmnichannelCallToggleLoading';
import NavBarItemOmnichannelCallToggleReady from './NavBarItemOmnichannelCallToggleReady';
import { useIsCallReady, useIsCallError } from '../../contexts/CallContext';

type NavBarItemOmnichannelCallToggleProps = ComponentPropsWithoutRef<
	typeof NavBarItemOmnichannelCallToggleError | typeof NavBarItemOmnichannelCallToggleLoading | typeof NavBarItemOmnichannelCallToggleReady
>;

const NavBarItemOmnichannelCallToggle = (props: NavBarItemOmnichannelCallToggleProps) => {
	const isCallReady = useIsCallReady();
	const isCallError = useIsCallError();
	if (isCallError) {
		return <NavBarItemOmnichannelCallToggleError {...props} />;
	}

	if (!isCallReady) {
		return <NavBarItemOmnichannelCallToggleLoading {...props} />;
	}

	return <NavBarItemOmnichannelCallToggleReady {...props} />;
};

export default NavBarItemOmnichannelCallToggle;
