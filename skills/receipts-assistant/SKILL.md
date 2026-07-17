---
name: receipts-assistant
description: Scan purchase emails to surface receipts and recurring subscriptions.
domain: email
---

# Receipts & Subscriptions

## Objective
Review recent purchase-related emails and extract a clean list of receipts and
recurring subscriptions, so the user can see exactly what they are paying for.

## Execution Steps
1. Read each purchase email (sender, subject, snippet).
2. Extract the vendor, amount, currency, and date.
3. Classify each as a one-time **receipt** or a recurring **subscription**
   (renewal / auto-pay / membership language → subscription).
4. For subscriptions, estimate the cadence: monthly, yearly, weekly, or unknown.

## Rules
- Only include real purchases, receipts, or subscriptions — ignore marketing.
- If an amount isn't clear, use 0 and still include the item.
- Prefer the merchant's name for the vendor (not the sending mail service).
