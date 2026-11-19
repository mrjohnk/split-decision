# Build log

A running record kept by the build agent while the game was made. Times are UTC. It exists so that
`ARCADE.md` and the README can be filled from what happened, not from memory.

## Session facts

| Item | Value |
| --- | --- |
| Build agent model | claude-fable-5-2 |
| Harness | Claude Code 2.1.328, running as a cloud session opened from the Claude app |
| Spec Kit | specify CLI 1.4.3.dev0, `claude` integration, skills mode |
| Owner | John (GitHub handle to be supplied) |
| Working style chosen by the owner | "Build it, I review after": the agent makes the design calls from the workshop defaults, records each one, and the owner reviews a playable game plus the answer key |

## Timeline

| Time (UTC) | Step | What happened |
| --- | --- | --- |
| 2026-11-19 13:04 | Request | Owner shared the NAF AC6 workshop repository and asked what entering would involve. |
| 2026-11-19 13:05–13:20 | Reading | Agent cloned the workshop repository, read the lab guide, the StarterKit, the three example games' `ARCADE.md` files and the 98-slide workshop deck, and the Arcade page. |
| 2026-11-19 13:31 | Deadline | Owner reported that submissions close on 2026-11-20. |
| 2026-11-19 ~13:55 | Decisions | Owner chose the topic (PON loss budget) and the working style (build, then review) in a two-question dialog. |
| 2026-11-19 14:07 | Start | `git init`, `specify init --here --integration claude --script sh`; StarterKit templates, attendee README and LICENSE copied from NAF_AC6. This is the recorded build start. |
| 2026-11-19 14:10–14:35 | Sources | Loss classes read from ITU-T G.9807.1 (02/2023) clause B.6.1; fiber values from ITU-T G.652 (08/2024) Table 2 and Appendix I; connector and splice guidance from the FOA guide; one published splitter table (TEC GR/TX/OPT-001). ITU-T G.671 could not be read past its abstract, so no number is attributed to it. |
| 2026-11-19 14:35–15:00 | Inputs | Six rounds designed and worked by hand; arithmetic cross-checked with a throwaway Decimal script. The three StarterKit inputs were personalized. The answer key was sent to the owner for checking. |
