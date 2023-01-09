import { Box, States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import NotFoundState from '../../components/NotFoundState';

const NotFoundPage = (): ReactElement => <NotFoundState title='Page_not_found' subtitle='Page_not_exist_or_not_permission' />;

export default NotFoundPage;
