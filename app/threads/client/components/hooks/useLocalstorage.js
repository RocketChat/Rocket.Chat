import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
	const [storedValue, setStoredValue] = useState(() => {
		try {
			const item = window.localStorage.getItem(key);
			return item ? JSON.parse(item) : initialValue;
		} catch (error) {
			console.log('useLocalStorage Error ->', error);
			return initialValue;
		}
	});

	const setValue = (value) => {
		try {
			const valueToStore = value instanceof Function ? value(storedValue) : value;

			setStoredValue(valueToStore);

			window.localStorage.setItem(key, JSON.stringify(valueToStore));
		} catch (error) {
			console.log('useLocalStorage setValue Error ->', error);
		}
	};

	useEffect(() => {
		function handleEvent(e) {
			if (e.key !== key) {
				return;
			}
			setStoredValue(JSON.parse(e.newValue));
		}
		window.addEventListener('storage', handleEvent);
		return () => window.removeEventListener('storage', handleEvent);
	}, [key]);

	return [storedValue, setValue];
}
