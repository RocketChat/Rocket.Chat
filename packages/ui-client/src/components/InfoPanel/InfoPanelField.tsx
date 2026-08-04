import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type InfoPanelFieldProps = ComponentPropsWithoutRef<typeof Box>;

const InfoPanelField = (props: InfoPanelFieldProps) => <Box marginBlock={16} {...props} />;

export default InfoPanelField;
