import React, { ComponentProps, ReactElement } from 'react';

const style = { width: '1.5em', height: '1.5em', verticalAlign: '-0.5em' };

type PositiveGrowthSymbolProps = Omit<ComponentProps<'svg'>, 'style'>;

const PositiveGrowthSymbol = (props: PositiveGrowthSymbolProps): ReactElement => (
	<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' style={style} {...props}>
		<path
			clipRule='evenodd'
			fill='currentColor'
			fillRule='evenodd'
			d={`M4.70712 15.3265L8.55757 11.4761C9.14335 10.8903 10.0931 10.8903
			10.6789 11.4761L11.9282 12.7254L15.9295 8.72417L14.2054 8.72417C13.6531
			8.72417 13.2054 8.27646 13.2054 7.72417C13.2054 7.17189 13.6531 6.72417
			14.2054 6.72417L18.3437 6.72418C18.896 6.72417 19.3437 7.17189 19.3437
			7.72418L19.3437 11.8625C19.3437 12.4148 18.896 12.8625 18.3437 12.8625
			C17.7914 12.8625 17.3437 12.4148 17.3437 11.8625L17.3437 10.1384L12.9889
			14.4932C12.4031 15.079 11.4534 15.079 10.8676 14.4932L9.61823 13.2439
			L6.12133 16.7408C5.73081 17.1313 5.09765 17.1313 4.70712 16.7408C4.3166
			16.3502 4.3166 15.7171 4.70712 15.3265Z`}
		/>
	</svg>
);

export default PositiveGrowthSymbol;
