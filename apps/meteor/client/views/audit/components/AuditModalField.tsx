import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type AuditModalFieldProps = ComponentPropsWithoutRef<typeof Box>;

const AuditModalField = (props: AuditModalFieldProps) => <Box mb={12} {...props} />;

export default AuditModalField;
