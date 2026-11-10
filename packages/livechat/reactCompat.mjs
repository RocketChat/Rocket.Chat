// `react` for the widget: Preact's compat layer plus React 19's `use`, which it lacks. Fuselage only reads contexts with it.
import { useContext } from 'preact/compat';

// oxlint can't see preact/compat's named exports
// oxlint-disable-next-line import/export
export * from 'preact/compat';
export { default } from 'preact/compat';

export const use = (context) => useContext(context);
