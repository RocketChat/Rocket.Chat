import type { FieldErrors, FieldValues, UseFormHandleSubmit } from 'react-hook-form';

import { FormValidationError } from './errors';

/**
 * Creates a submit handler that wraps React Hook Form's handleSubmit function with Promise-based error handling
 *
 * This utility function creates a submit handler that can be used with imperative calls, such as
 * through a ref. It properly handles validation errors from React Hook Form and ensures the returned
 * Promise resolves with the form submission payload or rejects with the appropriate error.
 *
 * @template FormData - The type of data managed by the form
 * @template FormSubmitPayload - The type of data returned after processing form values
 *
 * @param {(values: FormData) => FormSubmitPayload | Promise<FormSubmitPayload>} formHandler - The function that processes form values and returns a submission payload
 * @param {UseFormHandleSubmit<FormData, undefined>} handleSubmit - React Hook Form's handleSubmit function
 *
 * @returns {() => Promise<FormSubmitPayload>} A function that returns a Promise resolving with the submission payload or rejecting with an error
 *
 * @example
 * // In a form component with useForm
 * const { handleSubmit } = useForm<LoginFormData>();
 *
 * const processLogin = async (values: LoginFormData) => {
 *   const result = await loginUser(values);
 *   return result;
 * };
 *
 * // Use in imperative handle
 * useImperativeHandle(ref, () => ({
 *   submit: createSubmitHandler(processLogin, handleSubmit)
 */
export function createSubmitHandler<FormData extends FieldValues, FormSubmitPayload>(
	formHandler: (values: FormData) => FormSubmitPayload | Promise<FormSubmitPayload>,
	handleSubmit: UseFormHandleSubmit<FormData, undefined>,
) {
	return () =>
		new Promise<FormSubmitPayload>((resolve, reject) => {
			const onSuccess = async (values: FormData) => {
				try {
					const result = await Promise.resolve(formHandler(values));
					resolve(result);
				} catch (error) {
					reject(error);
				}
			};

			const onError = (errors: FieldErrors<FormData>) => {
				reject(new FormValidationError<FormData>('error-form-validation', { cause: errors }));
			};

			void handleSubmit(onSuccess, onError)();
		});
}
