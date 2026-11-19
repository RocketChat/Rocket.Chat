# Documenting Fuselage components

Fuselage's Storybook is the reference for anyone building a screen: what a component is
for, when to reach for it, and what each prop does. Every piece of that page has one
home, so it is written once and can't drift.

| What                          | Where                                                                  | Shown in                              |
| ----------------------------- | ---------------------------------------------------------------------- | ------------------------------------- |
| What the component is for     | JSDoc on the component                                                 | docs page description, editor tooltip |
| What a prop does              | JSDoc on the prop, in the component's props type                       | Controls table, editor tooltip        |
| How to use it well            | `parameters.docs.usage` on the stories' default export, in Markdown    | "Usage" section of the docs page      |
| What a story shows            | `parameters.docs.description.story`, only when the name doesn't say it | under the story                       |
| Concepts that span components | an `.mdx` page                                                         | its own sidebar entry                 |

## The component

One or two sentences on what the component is for, as JSDoc on the function. Lead with
what it does for the user, not how it renders: "Triggers an action: changes data or how it
is displayed…", not "A styled `button` element".

Don't set `parameters.docs.description.component`: it replaces the JSDoc on the docs page
and the two drift apart.

## Props

Document a prop where it is declared. Storybook reads the props with `react-docgen`, which
sees only the types declared in the component's own file, so:

- A prop declared in the component's props type gets its JSDoc there, and the story's
  `argTypes` entry carries no `description`.
- A prop the type inherits from another component's props (`TextInputProps = Omit<InputBoxProps, 'type'>`)
  doesn't reach the table. Give it an `argTypes` `description` in the stories, and only if
  its meaning isn't obvious.
- A prop whose name says it all (`disabled`, `onClick`, `children`) gets no description
  anywhere. See [code comments](../code-comments.md#let-the-declaration-carry-it).

Say what the prop changes for the user, and when to set it: "Replaces the icon with a
spinner and disables the button, with the label left as it is." `argTypes` keeps the
presentation of the control: `control`, `options`, `table.category`.

## Usage

`parameters.docs.usage` is a Markdown list of the rules a screen should follow: when to
use the component and when to use another one, how to combine it, what to avoid, and how
to word its labels. The docs page renders it under "Usage", between the description and
the first story.

The guidance comes from the design system's Figma file, which has a page per component
with "When to use", properties, do's and don'ts and UX writing notes. Transcribe it in the
code's terms: prop names and values (`variant='secondary-danger'`), not Figma's layer or
property names ("Secondary button with danger action"). Leave out what only applies to
designers working in Figma, such as how to toggle a component property.

Write each rule as an instruction: "Start a destructive flow with a `secondary-danger`
button and confirm it with a `danger` one." Group writing rules under a bold **Labels**
heading when there are several.

## Stories

A story's name says what it shows (`Sizes`, `Loading`, `AsLink`). Add a description only
when it shows something the name can't: a behavior to try ("Click the button to see the
loading state."), a constraint ("A label wider than the space the button gets is cut short
with an ellipsis."), or what a matrix's axes are.

## MDX pages

Write an `.mdx` page for what no single component owns: the introduction, getting
started, and each category's overview. A category overview says what the category is for
and which component to pick for which job, and links to each component's docs page. It
doesn't repeat their props.
