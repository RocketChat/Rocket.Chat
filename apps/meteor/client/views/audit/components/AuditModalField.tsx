import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type AuditModalFieldProps = ComponentPropsWithoutRef<typeof Box>;

const AuditModalField = (props: AuditModalFieldProps) => <Box marginBlock={12} {...props} />;

export default AuditModalField;
