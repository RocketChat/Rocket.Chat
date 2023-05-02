import { Box } from '@rocket.chat/fuselage';
import React, { forwardRef } from 'react';

const SearchingResultWrapper = forwardRef(function SearchingResultWrapper(props, ref: React.Ref<HTMLDivElement>) {
	return <Box ref={ref} {...props} is='ul' mb='x4' display='flex' flexWrap='wrap' />;
});

export default SearchingResultWrapper;
