export const filterAppByText = (name: string, text: string) =>
	name.toLowerCase().indexOf(text.toLowerCase()) > -1;
