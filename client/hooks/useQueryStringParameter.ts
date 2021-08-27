import { useQueryStringParameters } from './useQueryStringParameters';

export const useQueryStringParameter = (name: string): string | undefined =>
	useQueryStringParameters().get(name) ?? undefined;
