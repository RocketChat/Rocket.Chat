import React from 'react';

import { Navbar as NavbarComponent } from '../components/Navbar';
import NavbarAdministrationAction from './actions/NavbarAdministrationAction';
import NavbarAuditAction from './actions/NavbarAuditAction';
import NavbarHomeAction from './actions/NavbarHomeAction';
import NavbarMarketplaceAction from './actions/NavbarMarketplaceAction';
import NavbarUserAction from './actions/NavbarUserAction';

const Navbar = () => {
	return (
		<NavbarComponent>
			<NavbarUserAction />
			<NavbarHomeAction />
			<NavbarMarketplaceAction />
			<NavbarAuditAction />
			<NavbarAdministrationAction />
		</NavbarComponent>
	);
};

export default Navbar;
