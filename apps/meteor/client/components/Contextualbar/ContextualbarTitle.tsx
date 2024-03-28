import { ContextualbarTitle as ContextualbarTitleComponent } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React from 'react';

const ContextualbarTitle = (props: ComponentProps<typeof ContextualbarTitleComponent>) => (
	<ContextualbarTitleComponent id='contextualbarTitle' {...props} />
);

export default ContextualbarTitle;
