---
name: email-assistant
description: Analyze inbox messages to produce executive summaries and flag low-priority or promotional emails for deletion or archiving.
domain: email
---

# Email Assistant Skill

## Objective
Process incoming emails, generate short summaries, and identify cleanup targets.

## Execution Steps
1. Fetch unread messages and parse headers (Sender, Subject, Date).
2. Classify messages into standard categories (Action Required, Information, Low-Priority/Promotional).
3. Generate a bulleted summary of action items for high-priority messages.
4. Output a candidate list for deletion or archiving with brief rationales.

## Rules
- Never automatically delete messages from high-priority senders.
- Flag marketing and duplicate alert emails as clean-up targets.
