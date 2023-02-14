import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

import { SectionStatus } from './Section';

export default function getStatusIcon(type: SectionStatus): ReactElement {
	let svg;

	switch (type) {
		case SectionStatus.SUCCESS:
			svg = (
				<svg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
					<path
						fillRule='evenodd'
						clipRule='evenodd'
						d='M8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5ZM10.5965 6.77943C10.7956 6.58807 10.8018 6.27155 10.6105 6.07246C10.4191 5.87337 10.1026 5.8671 9.90351 6.05846L6.66866 9.16769L5.59609 8.13904C5.39679 7.94791 5.08027 7.95452 4.88913 8.15382C4.698 8.35312 4.70461 8.66964 4.90391 8.86077L6.32295 10.2217C6.51654 10.4074 6.82214 10.4072 7.01552 10.2213L10.5965 6.77943Z'
						fill='#2DE0A5'
					/>
				</svg>
			);
			break;
		case SectionStatus.FAILED:
			svg = (
				<svg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
					<path
						fillRule='evenodd'
						clipRule='evenodd'
						d='M14.5 8C14.5 11.5899 11.5899 14.5 8 14.5C4.41015 14.5 1.5 11.5899 1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8ZM10.3536 5.64645C10.5488 5.84171 10.5488 6.15829 10.3536 6.35355L8.70711 8L10.3536 9.64645C10.5488 9.84171 10.5488 10.1583 10.3536 10.3536C10.1583 10.5488 9.84171 10.5488 9.64645 10.3536L8 8.70711L6.35355 10.3536C6.15829 10.5488 5.84171 10.5488 5.64645 10.3536C5.45118 10.1583 5.45118 9.84171 5.64645 9.64645L7.29289 8L5.64645 6.35355C5.45118 6.15829 5.45118 5.84171 5.64645 5.64645C5.84171 5.45118 6.15829 5.45118 6.35355 5.64645L8 7.29289L9.64645 5.64645C9.84171 5.45118 10.1583 5.45118 10.3536 5.64645Z'
						fill='#F5455C'
					/>
				</svg>
			);
			break;
		case SectionStatus.UNKNOWN:
			svg = (
				<svg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
					<path
						fillRule='evenodd'
						clipRule='evenodd'
						d='M8 12.3333C10.3932 12.3333 12.3333 10.3932 12.3333 8C12.3333 5.60677 10.3932 3.66667 8 3.66667C5.60677 3.66667 3.66667 5.60677 3.66667 8C3.66667 10.3932 5.60677 12.3333 8 12.3333ZM8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z'
						fill='#9EA2A8'
					/>
				</svg>
			);
			break;
	}

	return <Box style={{ width: 20 }}>{svg}</Box>;
}
