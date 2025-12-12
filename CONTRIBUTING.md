<picture>
  <!-- The media queries determine the image based on website theme -->
  <source media="(prefers-color-scheme: dark)" srcset=".assets/banner/dark-mode.png">
  <source media="(prefers-color-scheme: light)" srcset=".assets/banner/light-mode.png">
  <!-- Fallback to light mode variant if no match -->
  <img alt="OpenTTD World Banner" src=".assets/banner/light-mode.png">
</picture>

######

This document outlines the guidelines for contributing to this repository, including best practices for code contributions and other relevant procedures. It is divided into multiple sections, which you can explore in the table of contents below. In the event of any conflicts between these sections, the section listed first will take precedence.

### Table of Contents

**Repository Contributing Guidelines**

- [Running the development environment](#running-the-development-environment)
- [Deploying the production environment](#deploying-the-production-environment)

**TypeScript Contributing Guidelines**

- [Writing documentation](#writing-documentation)  
  &nbsp; • &nbsp; [Writing directive comments](#writing-directive-comments)  
  &nbsp; • &nbsp; [Writing indicative comments](#writing-indicative-comments)
- [Declaring types](#declaring-types)
- [Naming code elements and files](#naming-code-elements-and-files)  
  &nbsp; • &nbsp; [Naming functions](#naming-functions)  
  &nbsp; • &nbsp; [Naming variables](#naming-variables)  
  &nbsp; • &nbsp; [Naming parameters](#naming-parameters)  
  &nbsp; • &nbsp; [Naming types](#naming-types)  
  &nbsp; • &nbsp; [Naming constants](#naming-constants)  
  &nbsp; • &nbsp; [Naming files](#naming-files)
- [Ordering code declarations](#ordering-code-declarations)

**Document Contributing Guidelines**

- [Storing document assets](#storing-document-assets)
- [Modifying CONTRIBUTING.md](#modifying-contributingmd)
- [Modifying README.md](#modifying-readmemd)

&nbsp;

## Repository Contributing Guidelines

### Running the development environment

This subsection guides contributors through initializing the development environment on their local machine. Following these steps ensures a consistent setup and allows you to test changes before submitting contributions.

First, ensure you have the right tools installed:

- Node.js `>20.0.0`.
- NPM `>10.0.0`.

Then, install dependencies:

```bash
npm install
```

Finally, run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Deploying the production environment

This project is not yet set up to be deployed to production.

&nbsp;

## TypeScript Contributing Guidelines

### Writing documentation

This subsection establishes guidelines for documenting code through comments and JSDoc annotations. Well-documented code reduces onboarding friction and serves as a safety net against future misunderstandings.

General rules for commenting:

1. Comment lines **must not** exceed 80 characters.

   _**Why?**_ Research suggests ~50-75 characters is easiest to read. 80 is a
   practical cap that works well in terminals and side-by-side diffs.

2. Comments using sentence grammar **must** follow natural language conventions (e.g., end with a full stop).

   _**Why?**_ Inconsistent punctuation looks sloppy and undermines the professionalism of the codebase.

Additionally, these guidelines enforce the usage of **directive** and **indicative** commenting, which you can read more about below.

#### Writing directive comments

Directive comments are inline annotations written in a _directive_ tone that describe each logical step within function implementations. They transform code into a readable narrative by pairing language with code, allowing reviewers and maintainers to understand the algorithm without parsing every line.

**Template**

```typescript
// [VERB:ACTION].
```

Where:

- `VERB` - Indicates the sentence must start with a verb (e.g., "Validate", "Calculate", "Fetch").
- `ACTION` - What the step accomplishes.

**Example**

```typescript
const processOrder = (order: Order): Receipt => {
  // Validate the order contents.
  if (!order.items.length) {
    throw new Error("Order must contain at least one item");
  }

  // Calculate the total price.
  const subtotal = order.items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  // Generate and return the receipt.
  return {
    orderId: order.id,
    subtotal,
    tax,
    total,
    timestamp: Date.now(),
  };
};
```

**Rules**

1. Each logical step **must** have a directive comment above it; the first or last step **may** be omitted if self-evident (e.g., destructuring, a return statement).

   _**Why?**_ Directive comments let readers skim logic without parsing implementation. Remove the code, and the comments alone should convey the algorithm.

2. Steps **must** be separated by a blank line; code within a step **must not** contain blank lines.

   _**Why?**_ Blank lines separate steps into skimmable chunks; blank lines
   inside a step break the grouping.

3. Comments **must** start with a verb (e.g., "Validate...", "Calculate...", "Fetch...").

   _**Why?**_ Verbs describe actions; nouns describe state. Code is action.

4. Comments **must** use `//`, not `/* */` or `/** */`.

   _**Why?**_ Single-line comments signal inline guidance, not API documentation.

5. Comments **should** describe the action, but **may** explain _how_ when the implementation is non-obvious.

   _**Why?**_ Usually the code shows how; `// Increment i` above `i++` is noise, not signal.

#### Writing indicative comments

Indicative comments document code element declarations (functions, variables, types) written in an _indicative_ tone by stating their identity and purpose. These comments appear at point-of-use and provide intent that types and signatures alone cannot express.

**Templates**

1\. Identity template, for things that _are_ (constants, types):

```typescript
/** A/The [THING] [RELATIONSHIP] [ROLE/PURPOSE]. */
```

Where:

- `A/The` - `"A"` for instances (types, classes), `"The"` for singletons (constants).
- `THING` - What it literally is (`"type"`, `"tolerance threshold"`, `"styled div"`).
- `RELATIONSHIP` - How it relates to its role (`"acting as"`, `"representing"`, `"for"`).
- `ROLE/PURPOSE` - What it's for.

2\. Action template, for things that _do_ (functions):

```typescript
/** [VERB:ACTION]. */
```

Where:

- `VERB` - Indicates the sentence must start with a verb (e.g., "Validates", "Calculates", "Fetches").
- `ACTION` - What it does, including its primary output or effect.

3\. Expanded template, which extends either the identity or action templates:

```typescript
/**
 * [IDENTITY or ACTION].
 *
 * [PURPOSE].
 *
 * @note [ADDITIONAL CONTEXT].
 */
```

Where:

- `IDENTITY or ACTION` - The first line, following either template above.
- `PURPOSE` - Additional context explaining why, if not obvious from the first line.
- `ADDITIONAL CONTEXT` - Optional. Any caveats or assumptions that don't fit elsewhere.

**Example**

```typescript
/** A styled div acting as the page header. */
const Header = styled.div`...`;

/** The maximum retry attempts before failure. */
const MAX_RETRIES = 3;

/** A type representing user authentication state. */
type AuthState = { ... };

/** Validates credentials and returns a session token. */
const authenticate = (credentials: Credentials): string | null => { ... };

/** Renders the user dashboard. */
export default function DashboardPage() { ... }

/**
 * Observes window resize events.
 *
 * Provides the current viewport dimensions.
 *
 * @note Throttled to 100ms to avoid performance issues.
 *
 * @param options - Configuration for throttling and initial dimensions.
 *
 * @returns The current viewport width and height.
 */
export function useViewport(options?: ViewportOptions): ViewportSize { ... }
```

**Rules**

1. All code elements **must** have a declaration comment stating what it is and what role it plays.

   _**Why?**_ Names don’t always capture intent. Requiring comments removes
   ambiguity about what should be documented, reducing decision fatigue.

2. The comment **should** explain why, unless the role is self-evident; trivial components **may** use a single-line form.

   _**Why?**_ The "purpose" captures intent code cannot express, but forcing it on trivial cases creates noise.

3. The comment **must not** explain how; reserve that for directive comments in the implementation.

   _**Why?**_ Declaration comments are for consumers. Implementation details belong where the logic lives.

4. All parameters **must** have a `@param` tag describing their purpose.

   _**Why?**_ Types show shape; `@param` explains intent (e.g., whether a
   `userId` is the actor or the profile being viewed).

5. Each group of tags (e.g., `@param`, `@returns`) **must** be separated by a blank line.

   _**Why?**_ Visual grouping makes the comment structure skimmable at a glance.

6. Tags **must** be limited to `@param`, `@returns`, `@note`, and `@warning`.

   _**Why?**_ These tags are widely supported across tools and editors; exotic tags may not render correctly.

7. Comments **must** start with `/**` and end with `*/` (JSDoc).

   _**Why?**_ Comments that don't appear at point-of-use are comments that don't get read.

### Declaring types

This subsection establishes conventions for declaring TypeScript types. A single, consistent approach eliminates decision fatigue and keeps the codebase uniform.

**Rules**

1. Type aliases (`type`) **must** be used instead of `interface` for declaring types.

   _**Why?**_ Types can do everything interfaces can, plus more (unions,
   mapped types, conditional types). One construct means no "type or interface?"
   decision.

2. Declaration merging **must not** be used as a justification for `interface`.

   _**Why?**_ Declaration merging - the only `interface` exclusive feature - is
   rarely needed in application code. Explicit intersections (`type C = A & B`)
   make composition visible; implicit merging across files causes subtle bugs.

### Naming code elements and files

This subsection defines naming conventions for functions, variables, types, constants, and files. Clear, consistent names reduce friction when reading and refactoring code, making intent explicit at every point of use.

#### Naming functions

1. Function names **must** follow `camelCase()` convention.

   _**Why?**_ `camelCase` is the standard JS/TS convention, which keeps naming
   consistent and predictable across the codebase.

2. Function names **should** follow a verb-noun structure (e.g., `fetchUser()`, `validateInput()`).

   _**Why?**_ Verb-noun makes intent explicit at the call site, reducing cognitive load when scanning code.

#### Naming variables

1. Variable names **must** follow `camelCase` convention.

   _**Why?**_ `camelCase` is the standard JS/TS convention, which keeps naming
   consistent and predictable.

2. Variable names **must** clearly indicate the variable's contents or purpose.

   _**Why?**_ Ambiguous names force readers to trace assignments, breaking their reading flow and forcing unnecessary context-switching.

3. Variable names **must not** use abbreviations, except for standard ones (e.g., `id` for identifier).

   _**Why?**_ Abbreviations create project-specific vocabulary that readers must
   memorize. They also reduce discoverability in search/autocomplete and make
   call sites harder to skim.

#### Naming parameters

1. Parameter names **must** follow `camelCase` convention.

   _**Why?**_ `camelCase` is the standard JS/TS convention, which keeps naming
   consistent and predictable.

2. Parameter names **must** clearly indicate the parameter's contents or purpose.

   _**Why?**_ Vague parameter names force readers to jump to the function definition to understand what to pass, breaking the reading flow at the call site.

3. Parameter names **must not** use abbreviations, except for standard ones (e.g., `id` for identifier).

   _**Why?**_ Parameters are read most often at the call site. Avoiding
   abbreviations keeps intent obvious without forcing readers to jump to a
   definition to decode shorthand.

#### Naming types

1. Type names **must** follow `PascalCase` convention.

   _**Why?**_ `PascalCase` is the standard TypeScript convention for types,
   which keeps declarations easy to spot.

2. Type names **should** use descriptive nouns or noun phrases that represent the data structure (e.g., `UserData`).

   _**Why?**_ Descriptive names reduce cognitive load by making a type's contents clear at a glance.

#### Naming constants

1. Constant names **must** follow `SNAKE_CASE` for deeply immutable constants (all uppercase).

   _**Why?**_ Upper snake case signals “immutable” at a glance.

2. Constant names **must** follow `camelCase` for shallow constants (objects, arrays, etc.).

   _**Why?**_ This avoids implying a `const` object is deeply immutable.

3. Constant names **must** clearly indicate the constant's contents or purpose.

   _**Why?**_ Magic values without context force readers to guess intent.

#### Naming files

1. File names **must** follow `kebab-case` convention.

   _**Why?**_ Kebab-case is widely used in web projects and stays readable at a
   glance. It also avoids accidental case-only renames, which can be error-prone
   on case-insensitive file systems.

2. File names **should** use concise names, typically 1-2 words.

   _**Why?**_ Short names scan faster in import lists and directory trees, making
   files easier to locate.

3. File names **must not** use abbreviations unless widely understood (e.g., `auth`).

   _**Why?**_ Abbreviations make files harder to find via search and increase the
   chance of inconsistent naming across the project.

4. File names **should** let directory structure provide context (e.g., `user/auth/tokens.ts`).

   _**Why?**_ Long filenames with multiple concepts signal that directory structure should carry that meaning instead - use hierarchy, not concatenation, to organize your files.

### Ordering code declarations

Maintaining a consistent order of declarations within `.ts` files helps contributors quickly locate specific elements within a file, reducing the cognitive load associated with navigating unfamiliar code.

Code elements **must** be organized in the following order:

1. **External imports**

   _**Why?**_ Third-party dependencies come first so readers immediately see what the file relies on.

2. **Internal imports**

   _**Why?**_ Local imports follow externals, separating "what we use" from "what we wrote".

3. **Types**

   _**Why?** Types must precede values so constants and functions can reference them._

4. **Global constants**

   _**Why?** Constants before variables signals immutability; they often configure what follows._

5. **Global variables**

   _**Why?** Variables often depend on constants; placing them after ensures dependencies are defined._

6. **Functions**

   _**Why?** Logic comes last, after all dependencies (imports, types, data) are established._

&nbsp;

## Document Contributing Guidelines

### Storing document assets

This subsection defines where to store assets used in documentation files like images, or other media.

**Rules**

1. Document assets **must** be stored in the `.assets` directory at the repository root.

   _**Why?**_ Using a platform-agnostic name eases migration if hosting changes. Considering `.github` is a common standard.

2. Assets **should** be organized into subdirectories that group related files (e.g., `.assets/banner/`, `.assets/icons/`).

   _**Why?**_ Assets often need light/dark mode variants or other related versions; subdirectories keep these variants together rather than scattered across a flat structure.

### Modifying CONTRIBUTING.md

This subsection defines rules for authoring and updating `CONTRIBUTING.md`. Consistent structure keeps the guide scannable and ensures that contributors can extend it predictably without degrading quality over time.

Subsections are primarily divided into two variants: **Guiding** subsections, **Convention** subsections and **Informational** subsections.

**Templates**

**Guiding**

```markdown
### [VERB:TITLE]

> This subsection [RELATIONSHIP] [SECTION] ► [SUBSECTION].

This subsection [ROLE & PURPOSE].

First, [STEP].

Then, [STEP].

Finally, [STEP].
```

Where:

- `VERB:TITLE` - A gerund-led title describing the action (e.g., "Running the development environment").
- `RELATIONSHIP` - How this subsection relates to another (`"extends"`, `"gets extended by"`, `"overrides"`, `"gets overriden by"`); omit the entire note line if not applicable.
- `SECTION ► SUBSECTION` - The target section and subsection being extended or overridden.
- `ROLE & PURPOSE` - What this subsection does and why it exists.
- `STEP` - A discrete action in the workflow.

**Convention**

```markdown
### [VERB:TITLE]

> This subsection [RELATIONSHIP] [SECTION] ► [SUBSECTION].

This subsection [ROLE & PURPOSE].

**Template(s)**

```[TEMPLATE]```

Where:

- `[PLACEHOLDER]` - [DESCRIPTION].

**Example(s)**

```[EXAMPLE]```

**Rule(s)**

1. [RULE]

   _**Why?**_ [RATIONALE].
```

Where:

- `VERB:TITLE` - A gerund-led title describing the pattern (e.g., "Naming React components").
- `RELATIONSHIP` - How this subsection relates to another (`"extends"`, `"gets extended by"`, `"overrides"`, `"gets overriden by"`); omit the entire note line if not applicable.
- `SECTION ► SUBSECTION` - The target section and subsection being extended or overridden.
- `ROLE & PURPOSE` - What this subsection does and why it exists.
- `TEMPLATE` - A reusable structure contributors should follow.
- `PLACEHOLDER` - A variable in the template requiring explanation.
- `DESCRIPTION` - What the placeholder means or how to fill it in.
- `EXAMPLE` - A concrete demonstration of the template in use.
- `RULE` - A rule statement using RFC modality (must, should, may).
- `RATIONALE` - The concrete reason the rule exists.

**Informational**

```markdown
### [VERB:TITLE]

[INFORMATION].
```

Where:

- `VERB:TITLE` - A gerund-led title describing the pattern (e.g., "Understanding the authentication system").
- `INFORMATION` - The information, which could range in size from a few sentences to a few paragraphs.

**Rules**

1. Rules **must** include exactly one _**Why?**_ paragraph per rule.

   _**Why?**_ The rule states the contract; the why preserves intent so future edits don't regress.

2. "Why" paragraphs **should** explain the causal link between the rule and its benefit, not just the benefit alone.

   _**Why?**_ "Consistent naming makes searches faster" explains causation; "improves code quality" just names a vague outcome without showing how the rule achieves it.

3. Rules **must** use consistent modality: **must**, **must not**, **should**, **may**.

   _**Why?**_ Standard wording makes requirement strength explicit to readers, reviewers, and AI.

4. The `extends`/`overrides` note **must** be included when the subsection modifies or builds upon another.

   _**Why?**_ Without the note, readers won't know rules conflict or stack; explicit precedence prevents misapplication.

5. **Template(s)** and **Example(s)** sections **may** be omitted when the rules are self-evident.

   _**Why?**_ Forcing examples on simple rule sets adds bulk without clarifying intent.

### Modifying README.md

This subsection defines rules for updating `README.md`. The README acts as a menu, a short, scannable entry point that directs readers to deeper documentation rather than duplicating it.

**Rules**

1. The README **must** stay short and act as a navigation hub, directing to docs like `CONTRIBUTING.md` or `LICENSE.md`.

   _**Why?**_ Readers land on the README first. A concise overview with clear links gets them to the right place faster than a wall of text.

2. Content **should** be moved to dedicated docs when it exceeds a few paragraphs.

   _**Why?**_ Long READMEs become hard to maintain and bury the essential "what is this / how do I run it" information.

&nbsp;
