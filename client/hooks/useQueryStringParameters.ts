import { useLocation } from 'react-router-dom';

export const useQueryStringParameters = (): URLSearchParams =>
	new URLSearchParams(useLocation().search);
