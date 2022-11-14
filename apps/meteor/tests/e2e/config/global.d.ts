declare namespace PlaywrightTest {
	interface Matchers<R> {
		hasAttribute(a: string): Promise<R>;
		toBeInvalid(): Promise<R>;
	}
}
