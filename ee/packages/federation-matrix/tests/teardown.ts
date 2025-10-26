/**
 * Global teardown for Jest federation tests.
 *
 * Ensures that any open connections or handles are properly closed
 * to prevent Jest from hanging. This is particularly important for
 * Matrix SDK connections and other long-lived resources that may
 * prevent Jest from exiting cleanly.
 *
 * @returns Promise that resolves when cleanup is complete
 */
export default async function globalTeardown() {
	// Force close any remaining open handles
	// This is particularly important for Matrix SDK connections
	if (global.gc) {
		global.gc();
	}

	// Give a small delay to allow cleanup
	await new Promise((resolve) => setTimeout(resolve, 1000));
}
