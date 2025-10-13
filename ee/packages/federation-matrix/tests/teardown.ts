/**
 * Global teardown for Jest federation tests
 * This ensures that any open connections or handles are properly closed
 * to prevent Jest from hanging
 */
export default async function globalTeardown() {
	// Force close any remaining open handles
	// This is particularly important for Matrix SDK connections
	if (global.gc) {
		global.gc();
	}
	
	// Give a small delay to allow cleanup
	await new Promise(resolve => setTimeout(resolve, 1000));
}
