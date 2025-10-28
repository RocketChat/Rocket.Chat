import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { Ref } from 'react';
import { forwardRef } from 'react';

const SearchingResultWrapper = forwardRef(function SearchingResultWrapper(props, ref: Ref<HTMLDivElement>) {
	const searchResultWrapperStyle = css`
		button {
			margin-right: 0.25rem;
			margin-bottom: 0.25rem;
			&:nth-child(9n) {
				margin-right: 0;
			}
		}
	`;

	return <Box ref={ref} {...props} className={searchResultWrapperStyle} display='flex' flexWrap='wrap' />;
});

export default SearchingResultWrapper;
