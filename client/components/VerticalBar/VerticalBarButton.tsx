import { Button } from '@rocket.chat/fuselage';
import React, { memo, FC } from 'react';

const VerticalBarButton: FC = (props) => <Button small square flexShrink={0} ghost {...props} />;

export default memo(VerticalBarButton);
