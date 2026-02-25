import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type InfoPanelFieldProps = ComponentPropsWithoutRef<typeof Box>;

const InfoPanelField = (props: InfoPanelFieldProps) => <Box mb={16} {...props} />;

export default InfoPanelField;
