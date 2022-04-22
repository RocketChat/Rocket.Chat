import { Icon } from '@rocket.chat/fuselage';

import { FlowRouter } from 'meteor/kadira:flow-router';

import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import React, { ReactElement } from 'react';

function ProductButton(): ReactElement {
	const handleRoute = useMutableCallback(() => {
		FlowRouter.go('/products');
	});
	return <Icon name='bag' size='x32' onClick={handleRoute} />;
}

export default ProductButton;
