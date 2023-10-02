export const getDaysLeft = (date: string): number => {
	const finalDate = new Date(date);
	const today = new Date();
	const diff = finalDate.getTime() - today.getTime();
	return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
