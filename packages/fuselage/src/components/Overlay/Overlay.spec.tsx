/* oxlint-disable testing-library/no-node-access -- an overlay's contract is where in the document its nodes land, which no query expresses */
import { render, screen } from '@testing-library/react';

import { Overlay } from '.';
import { OwnerDocument } from '../../contexts';

it('renders its children on the body, outside the place it is declared in', () => {
	const { container } = render(
		<Overlay>
			<p>Above the page</p>
		</Overlay>,
	);

	expect(container).toBeEmptyDOMElement();
	expect(screen.getByText('Above the page').parentElement).toBe(document.body);
});

it('renders nothing for a child that is not there', () => {
	const before = document.body.childElementCount;

	render(<Overlay>{false}</Overlay>);

	// A child that is not there adds no overlay node beside the test's own container
	expect(document.body.childElementCount).toBe(before + 1);
});

it('keeps the shared container for an empty overlay while another one leaves', () => {
	const { rerender } = render(
		<>
			<Overlay key='empty' containerId='shared'>
				{false}
			</Overlay>
			<Overlay key='full' containerId='shared'>
				<p>Full</p>
			</Overlay>
		</>,
	);

	rerender(
		<Overlay key='empty' containerId='shared'>
			{false}
		</Overlay>,
	);

	expect(document.getElementById('shared')).not.toBeNull();
});

it('leaves a container the application owns in place', () => {
	const host = document.createElement('div');
	host.id = 'owned';
	document.body.appendChild(host);

	const { unmount } = render(
		<Overlay containerId='owned'>
			<p>In the host</p>
		</Overlay>,
	);
	expect(host).toContainElement(screen.getByText('In the host'));

	unmount();
	expect(document.getElementById('owned')).toBe(host);
	host.remove();
});

it('follows a change of container', () => {
	const { rerender } = render(
		<Overlay containerId='first'>
			<p>Moving</p>
		</Overlay>,
	);
	expect(document.getElementById('first')).toContainElement(screen.getByText('Moving'));

	rerender(
		<Overlay containerId='second'>
			<p>Moving</p>
		</Overlay>,
	);
	expect(document.getElementById('second')).toContainElement(screen.getByText('Moving'));
	expect(document.getElementById('first')).toBeNull();

	rerender(
		<Overlay>
			<p>Moving</p>
		</Overlay>,
	);
	expect(screen.getByText('Moving').parentElement).toBe(document.body);
	expect(document.getElementById('second')).toBeNull();
});

it('shares one container between the overlays that name it', () => {
	render(
		<>
			<Overlay containerId='shared'>
				<p>First</p>
			</Overlay>
			<Overlay containerId='shared'>
				<p>Second</p>
			</Overlay>
		</>,
	);

	const shared = document.querySelectorAll('#shared');
	expect(shared).toHaveLength(1);
	expect(shared[0].parentElement).toBe(document.body);
	expect(shared[0]).toContainElement(screen.getByText('First'));
	expect(shared[0]).toContainElement(screen.getByText('Second'));
});

it('keeps the shared container while an overlay is left, and removes it with the last one', () => {
	const { rerender, unmount } = render(
		<>
			<Overlay key='first' containerId='shared'>
				<p>First</p>
			</Overlay>
			<Overlay key='second' containerId='shared'>
				<p>Second</p>
			</Overlay>
		</>,
	);

	rerender(
		<Overlay key='second' containerId='shared'>
			<p>Second</p>
		</Overlay>,
	);
	expect(document.getElementById('shared')).toContainElement(screen.getByText('Second'));
	expect(screen.queryByText('First')).not.toBeInTheDocument();

	unmount();
	expect(document.getElementById('shared')).toBeNull();
});

it('renders in the document it is given', () => {
	const popout = document.implementation.createHTMLDocument('popout');

	render(
		<OwnerDocument.Provider value={{ document: popout }}>
			<Overlay>
				<p>On the body</p>
			</Overlay>
			<Overlay containerId='shared'>
				<p>In the container</p>
			</Overlay>
		</OwnerDocument.Provider>,
	);

	expect(popout.body.lastElementChild?.textContent).toBe('On the body');
	expect(popout.getElementById('shared')?.textContent).toBe('In the container');
	expect(document.getElementById('shared')).toBeNull();
});
