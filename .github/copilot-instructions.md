# NextJS Playground - AI Coding Agent Instructions

## Project Overview
This is a Next.js 12 portfolio/playground app showcasing interactive algorithm visualizers and calculators. It's a **client-side-heavy application** with minimal server-side code. Each feature is a self-contained page with its own algorithmic logic.

## Architecture & Structure

### Page Organization
- **Pages are self-contained feature modules**: Each page ([pages/](pages/)) contains all state management and business logic for that feature
- **No shared state**: Pages don't communicate - each is independent
- **Direct algorithm imports**: Pages import algorithms from [utils/services/](utils/services/) and render their own components

Key pages:
- [pages/sudokuSolver.js](pages/sudokuSolver.js) - Backtracking sudoku solver with 9x9 grid UI
- [pages/towersOfHanoi.js](pages/towersOfHanoi.js) - Visual recursive Tower of Hanoi solver with step-through controls
- [pages/ammortizationCalculator.js](pages/ammortizationCalculator.js) - Loan payment calculator with amortization schedule

### Component Patterns
Components in [comps/](comps/) follow these conventions:

1. **Feature-specific subdirectories**: Components used by only one page live in `comps/<featureName>/`
   - Example: [comps/sudoku/cell.js](comps/sudoku/cell.js) is only used by sudoku solver
   - Example: [comps/towersOfHanoi/](comps/towersOfHanoi/) contains disc visualization components

2. **Shared components at root**: Reusable UI components live directly in `comps/`
   - [comps/actionButton.js](comps/actionButton.js) - Styled button with optional arrows (`leftArrow`, `rightArrow` props)
   - [comps/backLink.js](comps/backLink.js) - Standard "← Back" home link for all feature pages

3. **Component naming**: Use PascalCase for exports but camelCase for file names (e.g., `actionButton.js` exports `ActionButton`)

### State Management Approach
- **useState for all state**: No Redux, Context, or global state management
- **Immutable updates pattern**: Always clone arrays/objects before mutation:
  ```javascript
  let newBoard = [...dashboard.board];
  for(let row of dashboard.board) {
    newBoard[i] = [...row];  // Deep clone 2D arrays
  }
  ```
- **Grouped state objects**: Related state lives in single objects (e.g., `calculatorState`, `dashboard`)

### Algorithm Services
Pure functions in [utils/services/](utils/services/) contain core logic:
- [sudokuSolverFunctions.js](utils/services/sudokuSolverFunctions.js) - Backtracking algorithm with validation
- [towersOfHanoiAlgorithm.js](utils/services/towersOfHanoiAlgorithm.js) - Recursive solver that populates move arrays

**Key pattern**: Algorithms mutate passed-in arrays/boards directly (not React state), then caller sets new state with results.

## Styling & UI Framework
- **Bootstrap 5.1.3** is the primary UI framework
- Bootstrap CSS/JS imported in [pages/_app.js](pages/_app.js) (CSS at import time, JS in `useEffect`)
- **CSS Modules** for page-specific styles: [styles/Home.module.css](styles/Home.module.css)
- **Inline styles** used extensively for responsive sizing (see cell width calculations in [comps/sudoku/cell.js](comps/sudoku/cell.js))
- Responsive design uses window resize listeners, not media queries

## Development Workflow

### Running the app
```bash
npm run dev    # Development server on localhost:3000
npm run build  # Production build
npm start      # Run production build
```

### Key Dependencies
- `react-numeric-input` - Used in calculator and sudoku grid for number inputs
- Bootstrap 5 - Full Bootstrap (not React-Bootstrap) with manual JS import

### Adding New Features
1. Create page in `pages/<featureName>.js`
2. Add algorithm logic to `utils/services/<featureName>Functions.js`
3. Create feature-specific components in `comps/<featureName>/`
4. Import `BackLink` for navigation and `ActionButton` for primary actions
5. Add link card to [pages/index.js](pages/index.js) home page grid

## Project-Specific Conventions

### Prop Destructuring
Components always destructure props in parameters:
```javascript
const ActionButton = ({text, onClick, leftArrow, rightArrow}) => { ... }
```

### Event Handlers
- Prefix with `handle`: `handleCalculate`, `handleNextMove`, `handleSolution`
- Use arrow functions in event handler definitions
- Inline event handlers wrap calls: `onClick={(event) => onClick(event)}`

### Array Manipulation for Visualization
Tower of Hanoi demonstrates the pattern for step-through visualizations:
- Maintain two arrays: `moves` (remaining) and `movesHistory` (completed)
- Next button: shift from `moves`, unshift to `movesHistory`
- Previous button: reverse the operation
- This allows forward/backward stepping through algorithm execution

### Bootstrap Class Usage
- Use Bootstrap utility classes heavily: `pb-5`, `gx-5`, `text-center`, `bg-lighter`
- Grid system: `row` with `col-*` classes for layout
- Cards use plain `<div className="card">` (not custom components)

## Important Notes
- **Target audience**: Desktop/large screens - home page warns about screen size requirements
- **No TypeScript**: All files are `.js`, use JSDoc comments if you need type hints
- **No testing setup**: No test runner or test files currently in project
- **React 17**: Uses older JSX transform (requires React import in files)
