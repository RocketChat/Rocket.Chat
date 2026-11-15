import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type InfoPanelSectionProps = ComponentPropsWithoutRef<typeof Box>;

const InfoPanelSection = (props: InfoPanelSectionProps) => <Box marginBlock={24} {...props} />;

export default InfoPanelSection;
