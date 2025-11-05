const isOptimized = (() => {
	const value = localStorage.getItem('roomsCachedStoreOptimized');
	return value === 'true' || value === null;
})();

if (isOptimized) {
	console.info('RoomsCachedStore: Using optimized implementation');
} else {
	console.warn('RoomsCachedStore: Using non-optimized implementation');
}

export { isOptimized };
