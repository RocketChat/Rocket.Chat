# Building components

A component is a reusable piece of UI. It lives either in **Fuselage**, reusable by every Rocket.Chat application, or in the **application**, specific to it.

| Combination       | Fuselage | Application |
| ----------------- | -------- | ----------- |
| Simple & visual   | ✅       | ❌          |
| Complex & visual  | ✅       | ✅          |
| Simple & logical  | ❌       | ❌          |
| Complex & logical | ❌       | ✅          |

A component that starts in one application and turns out useful in others (as `VerticalBar` did) moves to Fuselage. Before building a new one, check with design and product whether an existing composition already covers the need.

How screens use components, and why they compose named containers instead of `Box`, is in [Layout in the app](layout.md).

## Layout containers

A layout container arranges other components: `Page`, `FieldGroup`, `Stack`, `ChatsFilterBar`. It is the one place where `Box` and raw layout belong, so screens don't need them.

- **Name it for its role** in the UI (`SettingsSection`, `EmptyState`), not its shape (`FlexRow`, `Wrapper`).
- **Give it only the options callers really vary**, as declared props with closed values, the same as any component (below).
- **It lives where its users are**, and moves up as it gets reused: in a `layout/` folder next to the screen, then `apps/meteor/client/components/`, then `packages/ui-client`, then Fuselage. Promoting it to Fuselage is a design-system decision, reviewed with design.
- **Don't wrap one primitive under a new name.** A container that only renames `Stack` with fixed props isn't worth one.

## The props a component accepts

A Fuselage component accepts:

- **DOM and ARIA attributes:** `id`, `role`, `aria-*`, `data-*`, event handlers, `ref`, `className`;
- **the variations it declares**, by name and with a closed set of values: `size='small'`, `variant='secondary'`, `color='danger'`, `is?: 'button' | 'a'`.

Nothing else. Its props type does not include `BoxProps`, and it does not forward styling props to the `Box` it renders:

```tsx
export type NoticeProps = {
	variant?: 'neutral' | 'info' | 'danger';
	inline?: boolean;
} & Omit<ComponentProps<'div'>, 'color' | 'is'>;

const Notice = ({ variant = 'neutral', inline, className, ...props }: NoticeProps) => (
	<div className={cx('rcx-notice', `rcx-notice--${variant}`, inline && 'rcx-notice--inline', className)} {...props} />
);
```

`Omit<…, 'color' | 'is'>` matters: React's HTML attribute types include `color?: string` and `is?: string`, which would clash with a declared `color` variation or a closed `is`.

An application component built on a Fuselage one types its props from that component, so it can't widen them back:

```tsx
type ResetSettingButtonProps = Omit<ComponentProps<typeof IconButton>, 'icon'>;
```

## No outer spacing

A component never sets its own outer margin, width or flex behavior. Those belong to the container (see [Layout in the app](layout.md)). A component that needs room for something it draws (a focus ring, a badge) makes that room inside its own box.

## Adding a variation

Add a variation when callers need a look the component doesn't offer and the need is a real option of the design, not a one-off:

- Name it for what it means (`variant='danger'`, `inverted`, `flush`), not for the CSS it sets (`color='red'`, `padding={0}`).
- Give it a closed set of values. A free value (`width`, `color: string`) is a styling prop under another name.
- Get the values from design.
- Add a story showing every value, which also gives it a visual regression baseline, and a changeset.

When a caller's need doesn't fit a variation, it belongs to the layout container around the component, not to the component. When the same container keeps showing up, that is the signal to promote it, or to turn it into a variation.

## Simple components

Simple components are atomic elements such as buttons or inputs.

- Build them from HTML elements and Fuselage's own SCSS, not by composing `Box` styling props.
- Customize them through CSS variables, not hardcoded values:

  ```scss
  $modal-margin: theme('modal-margin', auto);

  .rcx-modal {
  	margin: $modal-margin;
  }
  ```

- Document every variation in Storybook, with a note on the non-obvious ones.
- Unit test every behavior: rendering, interactions, keyboard, and accessible names.

## Complex components

Complex components combine simple ones: modals, tables, cards.

- **Visual only, no logic.** The component renders; the application decides.
- **Split into named parts** that callers compose, rather than one component with many props:

  ```tsx
  <Modal>
  	<ModalHeader>
  		<ModalTitle>{title}</ModalTitle>
  		<ModalClose onClick={onClose} />
  	</ModalHeader>
  	<ModalContent>{children}</ModalContent>
  	<ModalFooter>
  		<ButtonGroup>
  			<Button onClick={onClose}>{t('Cancel')}</Button>
  			<Button variant='primary' onClick={onConfirm}>
  				{t('Confirm')}
  			</Button>
  		</ButtonGroup>
  	</ModalFooter>
  </Modal>
  ```

- **Parts stay inside their parent.** A `VideoConfMessageAction` is used inside `VideoConfMessageFooter`, never on its own.
- **Storybook first.** Write the stories for every state before wiring the logic.
- **Offer hooks for shared state** (for example `useVideoConfControllers`) instead of duplicating it in each caller.

## Logical components

Logical components live in the application. They hold state and data, and render complex components.

- One component per state: render `IncomingPopup`, `OutgoingPopup` or `StartCallPopup` depending on the call state, rather than one component with conditionals in its markup.
- Customize through the variations the visual components declare, never by restyling them.
- Styles the application needs go in a stylesheet and reach the component through `className`.
