import React, { useEffect, useState } from 'react';

export const CallTime = () => {
	const [counter, setCounter] = useState(0);
	useEffect(() => {
		setTimeout(() => setCounter(counter + 1), 1000);
	}, [counter]);

	return (
		<div style={{ color: '#E4E7EA', fontSize: 15, textAlign: 'center', margin: 15 }}>
			<div> {new Date(counter * 1000).toISOString().substr(11, 8)}</div>
		</div>
	);
};
