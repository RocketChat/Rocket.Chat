import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type AuditModalLabelProps = ComponentPropsWithoutRef<typeof Box>;

const AuditModalLabel = (props: AuditModalLabelProps) => <Box mbe={4} fontScale='p2m' color='titles-labels' {...props} />;

export default AuditModalLabel;
