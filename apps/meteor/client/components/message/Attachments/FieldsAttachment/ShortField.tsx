import type { ComponentProps, FC } from 'react';
import React from 'react';

import Field from './Field';

const ShortField: FC<ComponentProps<typeof Field>> = (props) => <Field {...props} flexGrow={1} width='50%' flexBasis={1} />;

export default ShortField;
