// Disabled this flag since we need to wrap multiple components
/* eslint-disable react/no-multi-comp */
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { ReactNode, ComponentType, Ref, RefAttributes } from 'react';
import { VisuallyHidden } from 'react-aria';

import {
	useFieldReferencedByInput,
	useFieldReferencedByLabel,
	useFieldReferencedByLabelWithId,
	useFieldWrappedByInputLabel,
} from '../Field/FieldContext';

type WithLabelId = { id?: string };

function withLabelId<TProps, TRef>(Component: ComponentType<TProps & WithLabelId & RefAttributes<TRef>>) {
	function WrappedComponent(props: TProps & RefAttributes<TRef>) {
		const labelProps = useFieldReferencedByInput();
		return <Component {...props} {...labelProps} />;
	}

	WrappedComponent.displayName = `withLabelId(${Component.displayName ?? Component.name ?? 'InputComponent'})`;

	return WrappedComponent;
}

type WithLabelledBy = { 'aria-labelledby'?: string };

function withAriaLabelledBy<TProps, TRef>(Component: ComponentType<TProps & WithLabelledBy & RefAttributes<TRef>>) {
	function WrappedComponent(props: TProps & RefAttributes<TRef>) {
		const labelProps = useFieldReferencedByLabel();
		return <Component {...props} {...labelProps} />;
	}

	WrappedComponent.displayName = `withAriaLabelledBy(${Component.displayName ?? Component.name ?? 'InputComponent'})`;

	return WrappedComponent;
}

type WithLabelledByAndId = { 'aria-labelledby'?: string; 'id'?: string };

function withAriaLabelledByAndId<TProps, TRef>(Component: ComponentType<TProps & WithLabelledByAndId & RefAttributes<TRef>>) {
	function WrappedComponent(props: TProps & RefAttributes<TRef>) {
		const labelProps = useFieldReferencedByLabelWithId();
		return <Component {...props} {...labelProps} />;
	}

	WrappedComponent.displayName = `withAriaLabelledByAndId(${Component.displayName ?? Component.name ?? 'InputComponent'})`;

	return WrappedComponent;
}

type WithChildrenLabel = { labelChildren: ReactNode };

function withVisuallyHiddenLabel<TProps, TRef>(Component: ComponentType<TProps & WithChildrenLabel & RefAttributes<TRef>>) {
	function WrappedComponent(props: TProps & RefAttributes<TRef>) {
		const [label, labelProps, labelRef] = useFieldWrappedByInputLabel();
		const mergedRef = useMergedRefs(props.ref, labelRef as Ref<TRef>);
		return <Component {...props} {...labelProps} ref={mergedRef} labelChildren={<VisuallyHidden>{label}</VisuallyHidden>} />;
	}

	WrappedComponent.displayName = `withVisuallyHiddenLabel(${Component.displayName ?? Component.name ?? 'InputComponent'})`;

	return WrappedComponent;
}

export { withLabelId, withAriaLabelledBy, withAriaLabelledByAndId, withVisuallyHiddenLabel };
