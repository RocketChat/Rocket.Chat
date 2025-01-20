import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type FieldProps = { children?: ReactNode };

const Field = ({ children }: FieldProps) => <Box mb={16}>{children}</Box>;

export default Field;
