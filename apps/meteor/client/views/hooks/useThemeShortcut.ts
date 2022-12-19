import { useEffect } from 'react';
import tinykeys from 'tinykeys';

export function useThemeShortcut(command: string, action: (e: KeyboardEvent) => void, target: HTMLElement | Window = window): void {
	useEffect(() => {
		const unsubscribe = tinykeys(target, {
			[command]: action,
		});
		return (): void => unsubscribe();
	});
}
