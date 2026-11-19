# Contract: the page (`index.html`, `ui/`, `main.js`)

What the player can see and operate. The `ui/` modules render the session state and send actions to `engine/state.js`. They never decide an answer.

## Views

| View | Shown when | Content |
| --- | --- | --- |
| Loading | Until the content is fetched and validated | A short status line |
| Content error | The content failed to load or to validate | A heading, each error's place and message, a "Try again" button. No challenge |
| Briefing | `view` is `briefing` | The finished level's summary, if any; the level title and outcome; the introduction; the terms; a worked example; the sources cited; "Start level" |
| Round | `view` is `round` | The work order; the PON diagram and its text description; the path table; the class window; the loss card; the options; Submit, Hint, Worked solution, Next; guidance; revealed help; feedback |
| Summary | `view` is `summary` | A table with one row for each round (attempts, hints, worked solution, solved); the totals; what each level practiced; "Play again" |

Dialogs, each a native `<dialog>` opened as a modal: the current level's briefing ("Briefing"), the model and its sources ("Model and sources"), and the restart confirmation ("Restart").

## Controls and their names

| Control | Element | Accessible name | Test hook (`data-testid`) |
| --- | --- | --- | --- |
| Start level | button | "Start level N" | `start-level` |
| Design options | radio group in a fieldset with a legend | each option's label and the homes it serves | `option-<optionId>` |
| Submit | button, the form's submit | "Submit design" | `submit` |
| Hint | button | "Show hint 1" or "Show hint 2" | `hint` |
| Worked solution | button | "Show worked solution" | `solution` |
| Next | button | "Next round", "Next level" or "See summary" | `next` |
| Briefing | button | "Review briefing" | `open-briefing` |
| Model and sources | button | "Model and sources" | `open-model` |
| Restart | button | "Restart" | `restart` |
| Confirm, cancel restart | buttons | "Restart the game", "Keep playing" | `confirm-restart`, `cancel-restart` |
| Play again | button | "Play again" | `play-again` |
| Try again | button | "Try loading again" | `retry-load` |

Other test hooks: `view` on the main region with `data-view`; `guidance`; `feedback` with `data-outcome`; `meter-<ontId>` with `data-state` and `data-total`; `help`; `progress`; `summary-table`; `content-error`.

## Keyboard and focus

- Every control is a native element reached with Tab and operated with Enter or Space. Arrow keys move within the option group. Enter in the option group submits.
- The focused control has a visible outline that does not depend on color alone: 3 pixels wide, offset from the control.
- After a change of view, focus moves to the view's heading. After a correct submission, focus moves to Next. After an incorrect submission or an empty one, focus stays on Submit.
- A dialog takes focus when it opens, keeps it while open, closes with Escape, and returns focus to the control that opened it.

## Feedback

- Feedback and guidance are written into a region with `role="status"` and `aria-live="polite"`, so they are announced without moving focus.
- Feedback names the option it describes, and stays until the next submission or change of view.
- Every state has words and a shape: "Inside the window" with a ring, "Too dark" with a downward chevron, "Too bright" with a sunburst.
- Feedback for an incorrect submission never prints the answer's label, and ends with a next step chosen by outcome.

## Help

- Hint 1 and hint 2 are the round's two authored hints, shown in order and kept on screen once revealed.
- The worked solution is produced by `describeSolution` in `engine/feedback.js` from the round's evaluation: it names the answer and prints its ledger and total for every ONT. It is the only place where the answer is shown before the round is solved.

## Diagram and meters

- The diagram is an inline SVG drawn from the round's plant. It carries a generated text description, and the path table beside it gives each ONT's fiber km, connector pairs, splices and installed splitters.
- Each ONT has a light meter: a scale from 0 to 40 dB with the class window marked and labeled. Before a submission the meter shows no marker. After a submission the marker stands at the ONT's total and the meter prints the total, the state and the distance to the limit.

## Motion

- The result is in the page as soon as the submission is handled. The light pulse and the marker slide are decoration that follows.
- With `prefers-reduced-motion: reduce` no pulse or slide is played, and nothing else changes.

## Layout

- Two columns at 960 CSS pixels and wider: the work order on the left, the decision and feedback on the right. One column below that.
- At 320 CSS pixels wide the page does not scroll sideways. The path table, the loss card and the ledger scroll inside their own labeled containers.
- Text is at least 16 CSS pixels. Text contrast is at least 4.5 to 1.

## Delivery

- All URLs are relative, so the game runs from a repository subpath.
- No font, script, style or image is loaded from another origin. Links to sources open only when the player follows them.
