# Recap — Test Plan

## Unit Tests (Vitest)

### Pattern Detection (`src/__tests__/patterns.test.ts`)
- [x] Detects recurring themes across weeks
- [x] Does not flag themes appearing only once
- [x] Detects multiple themes simultaneously
- [x] Returns empty for no recaps
- [x] Handles null answer text gracefully
- [x] Sorts by occurrences descending

### Prompt Generation (`src/__tests__/prompts.test.ts`)
- [x] Generates prompt with system instruction (store name, week ending)
- [x] Includes all standard questions numbered
- [x] Includes store-specific questions with continued numbering
- [x] Includes RM themes when provided
- [x] Includes pattern flags when provided
- [x] Omits themes section when no rules
- [x] Omits patterns section when no flags
- [x] Ends with conversational instruction

## Integration Tests (Manual — via recap.loy.ee)

### Authentication
- [ ] Unauthenticated user redirects to /login
- [ ] Invalid credentials show error
- [ ] Successful login shows spinner then redirects to role-appropriate view
- [ ] Stale session (deleted entity) redirects to login gracefully
- [ ] Sign out clears session and returns to login

### SM Flow
- [ ] SM sees prompt copy bar with instructional sentence
- [ ] Copying prompt puts well-formed AI instruction in clipboard
- [ ] SM can fill in answers per question
- [ ] Save Draft persists answers (refresh keeps them)
- [ ] Submit changes status to "submitted"
- [ ] Past recaps display with answers and status badges
- [ ] Other stores section shows all region stores
- [ ] Clicking other store opens history modal
- [ ] RM feedback notes appear in "Notes from Your RM"

### RM Flow
- [ ] Dashboard shows all stores with status (submitted/pending)
- [ ] Week navigator switches between weeks
- [ ] Clicking store with recap opens expanded view
- [ ] Expanded view shows full recap on left, notes on right
- [ ] RM can add private notes (for consolidation)
- [ ] RM can add notes to SM (visible to SM)
- [ ] Private notes appear in "My Notes This Week" summary
- [ ] Notes feed into consolidation prompt
- [ ] Consolidated recap saves as draft/submitted
- [ ] Consolidation prompt includes store recaps + RM notes
- [ ] Copy prompt works for consolidation
- [ ] AD notes display when present
- [ ] Other RMs' consolidated recaps appear at bottom
- [ ] Question Builder modal: view templates, add questions, delete questions
- [ ] Question Builder: create new template (standard or store-specific)
- [ ] Question Builder: add/remove themes and directions
- [ ] Admin modal: view stores and SMs
- [ ] Admin modal: add new store
- [ ] Admin modal: add new SM with login credentials

### AD Flow
- [ ] Overview shows all RMs with consolidated recaps
- [ ] AD prompt generates with RM summaries
- [ ] Copy prompt works
- [ ] Market recap textarea persists on save (survives refresh)
- [ ] AD can leave notes on RM consolidated recaps
- [ ] Notes flow down to RM dashboard

### Cross-Cutting
- [ ] Pattern detection flags appear for recurring themes
- [ ] Prompts embed patterns as challenge questions
- [ ] Week navigation shows all available weeks
- [ ] Role-based routing works (SM/RM/AD see different views)

## Test Schedule

| When | What | Who |
|------|------|-----|
| After each feature | Run `npm test` | Developer |
| Before deploy | Full unit test suite + build check | Developer |
| After deploy | Manual smoke test of changed flows | Developer + Stakeholder |
| Weekly | Full manual integration test | Stakeholder |

## Findings Log

| Date | Finding | Impact | Resolution |
|------|---------|--------|------------|
| 2026-04-03 | Stale session after reseed crashes page | High | Added /api/auth/reset route |
| 2026-04-03 | signOut() can't modify cookies in server component | High | Redirect to API route instead |
| 2026-04-03 | Vercel env vars missing on first deploy | Medium | Added DATABASE_URL + AUTH_SECRET before deploy |
| 2026-04-03 | Prompt pasted into AI treated as template, not instruction | High | Rewrote prompt to frame AI as writing assistant |
| 2026-04-03 | shadcn v4 uses render prop not asChild | Medium | Updated dialog triggers to use render={<Button/>} |
