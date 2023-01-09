import type { ReactElement } from 'react';
import React from 'react';

import NotFoundState from '../../components/NotFoundState';

const NotFoundPage = (): ReactElement => <NotFoundState title='Page_not_found' subtitle='Page_not_exist_or_not_permission' />;

export default NotFoundPage;
