import { createRoot } from 'react-dom/client';

import * as P from './Probe';

createRoot(document.getElementById('root')!).render(
	<>
		{Object.values(P).map((Probe, i) => (
			<Probe key={i} variant='danger' big className='x' onClick={() => undefined} disabled rest={{ title: 't' }}>
				c
			</Probe>
		))}
	</>,
);
