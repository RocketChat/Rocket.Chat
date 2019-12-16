import React, { useMemo } from 'react';
import './SkeletonText.css';


export function SkeletonText() {
	const width = useMemo(() => `${ Math.random() * 10 + 10 }em`, []);

	return <span className='Admin__InformationPage__SkeletonText' style={{ width }} />;
}
