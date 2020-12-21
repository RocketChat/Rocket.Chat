import { Box } from '@rocket.chat/fuselage';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { ReactiveDict } from 'meteor/reactive-dict';
import React, { useEffect, useRef } from 'react';

export const Message = ({ msg, ...props }) => {
	const siblingRef = useRef(); // the node rendered by the component
	const viewNodeRef = useRef(); // the node rendered by the template
	const depRef = useRef(new Tracker.Dependency()); // dependency to force template update

	// the data passed to the template
	const dataContextRef = useRef(new ReactiveDict({
		...props,
		msg: { ...msg },
	}));

	// we update it according to the props at each re-render
	dataContextRef.current.set({
		...props,
		msg: { ...msg },
	});

	useEffect(() => {
		if (!siblingRef.current) {
			return;
		}

		const sibling = siblingRef.current; // this component's node will be the sibling of the template node
		const parent = siblingRef.current.parentElement; // both share the same parent

		// the data context as a reactive function that will be consumed by a internal tracker
		const dataContextFn = () => {
			depRef.current.depend(); // the computation will react any time we change this dependency
			return dataContextRef.current.all();
		};

		const view = Blaze.renderWithData(Template.message, dataContextFn, parent, sibling);
		viewNodeRef.current = view.firstNode(); // this is node is rendered before its sibling

		return () => {
			Blaze.remove(view);
		};
	}, []);

	useEffect(() => {
		if (!siblingRef.current) {
			return;
		}

		// force the view node to ALWAYS be before sibling node
		siblingRef.current.parentElement.insertBefore(viewNodeRef.current, siblingRef.current);
		// force template update, recomputing `processSequentials` function
		depRef.current.changed();
	});

	// use appropriate props to help `processSequentials` function
	return <Box ref={siblingRef} is='li' data-timestamp={msg?.ts?.getTime()} />;
};
