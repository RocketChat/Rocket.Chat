import type { ReactElement } from 'react';

import SlaEdit from './SlaEdit';

function SlaNew({ reload }: { reload: () => void }): ReactElement {
	return <SlaEdit isNew reload={reload} />;
}

export default SlaNew;
