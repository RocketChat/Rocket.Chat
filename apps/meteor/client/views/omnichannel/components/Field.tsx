import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type FieldProps = { children?: ReactNode };

const Field = ({ children }: FieldProps) => <Box marginBlock={16}>{children}</Box>;

export default Field;
