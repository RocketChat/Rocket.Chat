import type { ComponentPropsWithoutRef } from 'react';

import Field from './Field';

type ShortFieldProps = ComponentPropsWithoutRef<typeof Field>;

const ShortField = (props: ShortFieldProps) => <Field {...props} flexGrow={1} width='50%' flexBasis={1} />;

export default ShortField;
