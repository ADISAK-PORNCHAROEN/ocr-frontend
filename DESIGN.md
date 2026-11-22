# OCR Playground design system

## Overview

Status: direction agreed; visual design and implementation are not established. The owner wants a clean, readable work tool with one primary color and clear success/error states; use Impeccable for the later UX/UI design. Source inspected: [frontend plan](docs/frontend-plan.md), [specification](docs/spec.md), and the current repository, which has no UI, assets, components, tokens, screenshots or rendered output.

This document follows the [DESIGN.md pattern](https://getdesign.md/what-is-design-md) and [format reference](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md). No token values are recorded until a visual direction is designed and accepted.

## Colors

Primary, neutral, feedback, contrast and state values are not established. Assign semantic roles and verify contrast during design rather than inferring a palette.

## Typography

Font family, sizes, weights, line height and tracking are not established. Text must support Thai and English; validate readability with actual document content.

## Layout

The home surface offers a short introduction and immediate upload. Desktop review places image and text side by side; mobile stacks them. Exact containers, gutters, spacing and breakpoints await design and rendered verification.

### Responsive and accessible behavior

The whole workflow must work on mobile and desktop, with readable state/error messages and keyboard-operable, labeled controls. Design and verify focus handling, contrast, touch targets and reduced motion with actual UI.

## Elevation & Depth

Surface hierarchy, borders and shadows are not established.

## Shapes

Radii and border treatments are not established.

## Components

Project-owned reusable UI primitives are intended for controls such as button, input, select, textarea, dialog and progress as needed. OCR-specific components compose these primitives. States for upload, queued/processing, successful blank page, failed page, partial result, expiry and recovery must be designed and verified.

## Do's and Don'ts

- Prioritize comparison of source image and text and keep progress and recovery understandable.
- Do not represent a failed OCR page as a successful blank page.

### Agent usage and visual acceptance

Read this file and [PRODUCT.md](PRODUCT.md) for UI work. Use the project-local Impeccable workflow to establish product context and visual direction; then update this document from accepted decisions and actual implementation. No visual baseline or rendered acceptance evidence exists yet. Inspect desktop and mobile states when UI becomes available.
