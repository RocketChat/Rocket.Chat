import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

const style = { width: '1.5em', height: '1.5em', verticalAlign: '-0.5em' };

type NegativeGrowthSymbolProps = Omit<ComponentProps<'svg'>, 'style'>;

const NegativeGrowthSymbol = (props: NegativeGrowthSymbolProps): ReactElement => (
	<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 25 24' style={style} {...props}>
		<path
			clipRule='evenodd'
			fill='currentColor'
			fillRule='evenodd'
			d={`M4.70712 8.50049L8.55757 12.3509C9.14335 12.9367 10.0931 12.9367
			10.6789 12.3509L11.9282 11.1016L15.9295 15.1029L14.2054 15.1029C13.6531
			15.1029 13.2054 15.5506 13.2054 16.1029C13.2054 16.6551 13.6531 17.1029
			14.2054 17.1029L18.3437 17.1029C18.896 17.1029 19.3437 16.6551 19.3437
			16.1029L19.3437 11.9645C19.3437 11.4123 18.896 10.9645 18.3437 10.9645
			C17.7914 10.9645 17.3437 11.4123 17.3437 11.9645L17.3437 13.6886L12.9889
			9.33382C12.4031 8.74803 11.4534 8.74803 10.8676 9.33382L9.61823 10.5832
			L6.12133 7.08627C5.73081 6.69575 5.09765 6.69575 4.70712 7.08628C4.3166
			7.4768 4.3166 8.10996 4.70712 8.50049Z`}
		/>
	</svg>
);

export default NegativeGrowthSymbol;
