import { type Static, t } from "elysia";

export const ErrorResponseDto = t.Object({
	error: t.String(),
	details: t.Any(),
});

export type ErrorResponse = Static<typeof ErrorResponseDto>;