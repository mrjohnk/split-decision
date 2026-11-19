# Contract: the page (`index.html`, `ui/`, `main.js`)

What the player can see and operate. The `ui/` modules render the session state and send actions to `engine/state.js`. They never decide an answer.

## Views

| View | Shown when | Content |
| --- | --- | --- |
| Loading | Until the content is fetched and validated | A short status line |
| Content error | The content failed to load or to validate | A heading, each error's place and message, a "Try again" button. No challenge |
| Briefing | `view` is `briefing` | The finished level's summary, if any; the level title and outcome; the introduction; a worked example with its plant, loss trace and ledger; the terms; the sources cited; "Start level", which stays at the bottom of the window while the briefing scrolls |
| Round | `view` is `round` | Left, the work order: the story, the launch power and the receive window, the plant drawing (with the launch power at the OLT) and its text description, the path table, the loss card. Right, the decision: the goal, the options, Submit and Next, Hint and Worked solution, guidance, revealed help, the loss trace with a meter row for each ONT, and the feedback |
| Summary | `view` is `summary` | A table with one row for each round (attempts, hints, worked solution, solved); the totals; what each level practiced; "Play again" |

Dialogs, each a native `<dialog>` opened as a modal: the current level's briefing ("Briefing"), the model and its sources ("Model and sources"), and the restart confirmation ("Restart").

## Controls and their names

| Control | Element | Accessible name | Test hook (`data-testid`) |
| --- | --- | --- | --- |
| Start level | button | "Start level N" | `start-level` |
| Design options | radio group in a fieldset with the legend "Design options" | each option's label; the homes it serves are the option's description (`aria-describedby`) | `option-<optionId>` on the option's label element |
| Submit | button, the form's submit | "Submit design" | `submit` |
| Hint | button | "Show hint 1" or "Show hint 2" | `hint` |
| Worked solution | button | "Show worked solution" | `solution` |
| Next | button | "Next work order", "Next level" or "See summary" | `next` |
| Briefing | button | "Review briefing" | `open-briefing` |
| Model and sources | button | "Model and sources" | `open-model` |
| Restart | button | "Restart" | `restart` |
| Confirm, cancel restart | buttons | "Restart the game", "Keep playing" | `confirm-restart`, `cancel-restart` |
| Play again | button | "Play again" | `play-again` |
| Try again | button | "Try loading again" | `retry-load` |

| Close a dialog | buttons | "Back to the work order", "Close" | `close-briefing`, `close-model` |

Other test hooks: `view` on the main region with `data-view` and, in a round, `data-round`; `window`; `plant-text`; `paths`; `losscard`; `design-form`; `guidance`; `tally`; `help`, `hint-1`, `hint-2`, `solution-text`; `meter-launch`; `meter-<ontId>` with `data-state` (`none` before a submission), `data-level` (the receive level, with an ASCII minus sign) and `data-total` (the loss); `meter-shared`; `feedback` with `data-outcome` and `data-option`, and inside it `feedback-headline`, `line-<ontId>`, `feedback-explain`, `feedback-note`, `feedback-next`, `ledger-text-<ontId>`; `progress`; `level-summary` with `level-solved`, `level-attempts`, `level-hints`, `level-solutions`; `summary-table` with `summary-<roundId>`, `total-attempts`, `total-hints`, `total-solutions`, `total-solved`, `without-solution`, `no-help`; `content-error`; `announcer`; the three dialogs `briefing-dialog`, `model-dialog`, `restart-dialog`.

## Keyboard and focus

- Every control is a native element reached with Tab and operated with Enter or Space. Arrow keys move within the option group. Enter in the option group submits.
- The focused control has a visible outline that does not depend on color alone: 3 pixels wide, offset from the control.
- After a change of view, focus moves to the view's heading. After a correct submission, focus moves to Next. After an incorrect submission or an empty one, focus stays on Submit. After hint 1 focus stays on the hint button; after hint 2 it moves to the worked solution button; after the worked solution it moves to Submit.
- A dialog takes focus when it opens, keeps it while open, closes with Escape, and returns focus to the control that opened it. The restart dialog opens with focus on "Keep playing", so Enter never restarts by accident. Escape in the restart dialog means "Keep playing".
- After a submission that was graded, if the result is below the window, the page moves just far enough to show the loss trace and the lines of feedback under it, and never so far that the trace leaves the window. The move is instant.

## Feedback

- Feedback and guidance are shown in the page and their text is also written into a visually hidden region with `role="status"` and `aria-live="polite"` (`announcer`), so they are announced without moving focus. A revealed hint is announced the same way.
- Feedback names the option it describes ("Your design: ..."), and stays until the next submission or change of view.
- The headline of the answer begins with "Correct."; no other headline does.
- Every state has words and a shape: "Inside the window" with a ring, "Too dark" with a downward chevron, "Too bright" with a sunburst.
- Feedback for an incorrect submission never prints the answer's label, and ends with a next step chosen by outcome.

## Help

- Hint 1 and hint 2 are the round's two authored hints, shown in order and kept on screen once revealed.
- The worked solution is produced by `describeSolution` in `engine/feedback.js` from the round's evaluation: it names the answer and prints its ledger and total for every ONT. It is the only place where the answer is shown before the round is solved.

## Drawings

- The plant is an inline SVG drawn from the round's data, left to right from the OLT port to each ONT. The splitter the player chooses and any attenuator of the selected design are drawn in the designer's orange and follow the selection. The drawing carries a generated text description, and the path table beside it gives each ONT's fiber km, connectors, splices and splitters.
- The loss trace is an inline SVG on the dark instrument panel. Its scale is the light level in dBm: every trace starts at the launch power at the top left, and each loss takes it down. The receive window is a band with its two limits labeled on the scale, as is the launch power; "Too bright" is named above the band and "Too dark" below. A zone's name is drawn only where no trace runs through it, and is left out when there is no such place. Each ONT has one line that falls at every element of its path and ends at its receive level. A stretch of path that several ONTs share is drawn once in a neutral color. Before a submission the panel shows only the scale and the window.
- Under the trace is a row for the launch power and a meter row for each ONT: its line key, its name, and after a submission its receive level, its state word and its state shape. The rows are the legend of the trace and its text equivalent.
- Every column of the trace has a hover target whose title says what the light meets there and the level after it.
- The three line colors were validated for color-vision deficiency and contrast against the panel's background with the data-visualization validator; text on the panel never takes a line's color.

## Motion

- The result is in the page as soon as the submission is handled. Then the loss trace draws itself once, left to right in under a second, and its end markers appear. That is the only animation in the game.
- With `prefers-reduced-motion: reduce` nothing is animated, and nothing else changes.

## Layout

- Two columns at 960 CSS pixels and wider: the work order on the left, the decision and feedback on the right. One column below that.
- At 320 CSS pixels wide the page does not scroll sideways. The path table and the ledgers scroll inside their own labeled containers when they need to; the loss card is a list of name and value pairs that folds from three columns to one.
- Running text is at least 16 CSS pixels. Labels inside the two drawings are at least 12 CSS pixels, and every value a player needs from a drawing is also in a table or a line of text. Text contrast is at least 4.5 to 1.

## Delivery

- All URLs are relative, so the game runs from a repository subpath.
- No font, script, style or image is loaded from another origin. The two font families are files of the game. Links to sources open only when the player follows them.
- Nothing is stored in the browser: no cookie, no localStorage, no sessionStorage.
