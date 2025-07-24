import { useMemo, useState } from 'react';

export const useDialpad = (onChange: (value: string) => void, onClose: () => void) => {
	const [open, setOpen] = useState(false);

	const dialpad = useMemo(() => {
		if (!open) {
			return null;
		}

		return <Dialpad onChange={onChange} onClose={onClose} />;
	}, [open, onChange, onClose]);

	return { dialpad, open, setOpen };
};
