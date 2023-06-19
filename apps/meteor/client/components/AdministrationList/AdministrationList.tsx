import { OptionDivider } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';
import React, { Fragment } from 'react';

type AdministrationListProps = {
	optionsList: ReactNode[];
};

const AdministrationList = ({ optionsList }: AdministrationListProps): ReactElement => {
	return (
		<>
			{optionsList.map((item, index) => (
				<Fragment key={index}>
					{index > 0 && <OptionDivider />}
					{item}
				</Fragment>
			))}
		</>
	);
};

export default AdministrationList;
