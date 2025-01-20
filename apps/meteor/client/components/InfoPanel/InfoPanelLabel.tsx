import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type InfoPanelLabelProps = ComponentPropsWithoutRef<typeof Box>;

const InfoPanelLabel = (props: InfoPanelLabelProps) => <Box mb={8} fontScale='p2m' color='default' {...props} />;

export default InfoPanelLabel;
