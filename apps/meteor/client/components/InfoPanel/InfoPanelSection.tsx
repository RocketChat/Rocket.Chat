import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type InfoPanelSectionProps = ComponentPropsWithoutRef<typeof Box>;

const InfoPanelSection = (props: InfoPanelSectionProps) => <Box mb={24} {...props} />;

export default InfoPanelSection;
