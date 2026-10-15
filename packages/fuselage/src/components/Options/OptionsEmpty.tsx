import { memo } from 'react';

import { Option } from '../Option';

export type OptionsEmptyProps = {
	customEmpty?: string;
};

const OptionsEmpty = ({ customEmpty }: OptionsEmptyProps) => <Option label={customEmpty || 'Empty'} />;

export default memo(OptionsEmpty);
