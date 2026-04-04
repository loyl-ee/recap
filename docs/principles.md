# Development Principles Reference

This document distills development principles from 25 software legends, companies, and builders whose work defines the highest standards in the industry. It serves as a living reference for the Recap project -- a benchmark against which we hold our own architecture, code quality, and product decisions.

These are not abstract platitudes. Each principle is drawn from people who shipped real software, ran real companies, and made real trade-offs. When we make a decision about Recap, we should be able to defend it in front of this room.

---

## Individual Profiles

---

### 1. Marco Arment
**Who:** Co-founder of Tumblr, creator of Instapaper and the Overcast podcast app. One of the most prominent indie Mac/iOS developers. Prolific blogger and co-host of the Accidental Tech Podcast.

**Core Principles:**
- Opinionated defaults over endless settings -- if you haven't decided, the user shouldn't have to
- Performance is a feature, not an optimization pass you do later
- Do fewer things, better -- five things done well beats fifteen done okay
- Respect the platform -- build native, follow conventions, use Dynamic Type and Dark Mode
- Ship and iterate publicly; be honest about mistakes

**What he'd critique in Recap:** The SM view loads seven parallel data fetches in a server component -- he'd ask whether the user actually needs all of that on initial load, or whether some could be deferred. He'd also question whether the pattern detection keyword matching is too simplistic for production.

**What he'd praise:** The prompt generation system is opinionated -- it walks users through questions one at a time rather than dumping a blank form. The AI prompt has a clear, specific voice rather than being generic.

---

### 2. Sal Soghoian
**Who:** Apple's Director of Automation Technologies for nearly 20 years. Responsible for AppleScript, Automator, and the user automation philosophy at Apple.

**Core Principles:**
- Users are participants, not passive consumers -- software should be scriptable and extensible
- Automation is accessibility; locking down an app is exclusionary
- If a user does something more than twice, the software should help them automate it
- Inter-app communication is sacred -- apps should not be data silos
- Build for power users without abandoning novices

**What he'd critique in Recap:** No API endpoints, no webhooks, no way for an RM to programmatically pull recap data into another system. The recaps are trapped inside the app. No bulk export capability.

**What he'd praise:** The template system lets RMs customize questions per store -- that's a form of user-driven automation. The prompt rules system gives RMs indirect control over the AI assistant's behavior.

---

### 3. Rich Siegel
**Who:** Founder of Bare Bones Software. Creator of BBEdit, in continuous development since 1992. Tagline: "It doesn't suck."

**Core Principles:**
- Reliability above all -- data loss is a cardinal sin
- Longevity through discipline; don't rewrite working code to chase frameworks
- "It doesn't suck" means: it works, it's fast, it handles edge cases
- Power features should be discoverable at your own pace, not overwhelming at first
- Sustainable architecture that can evolve for decades

**What he'd critique in Recap:** The `recap_answer` table has nullable `answerText` and `answerValue` without a check constraint -- it's possible to create an answer with neither field populated. He'd want belt-and-suspenders data integrity. He'd also ask about auto-save for the recap form.

**What he'd praise:** The schema is clean and well-organized with proper foreign key relationships. The history tracking tables (`storeRegionHistory`, `smStoreHistory`) show forethought about data integrity over time.

---

### 4. C. Scott Andreas
**Who:** Systems engineer known for distributed systems, infrastructure reliability, and operational excellence.

**Core Principles:**
- Understand the full stack, from disk I/O to the UI
- Design for failure -- does the system degrade gracefully or catastrophically?
- Observability is non-negotiable: metrics, logging, tracing
- Operational empathy -- think about the on-call engineer at 3 AM
- Simplicity in architecture; every moving part is a failure mode

**What he'd critique in Recap:** No error boundaries in the React components. No logging or observability beyond what Next.js provides by default. If the database goes down, what does the user see? There's no graceful degradation path. The `entityExists` check in `page.tsx` has a bare `catch` that silently returns false -- that could mask real errors.

**What he'd praise:** The architecture is genuinely simple -- a Next.js monolith with a Postgres database. No microservices, no message queues, no unnecessary complexity. The scale matches the architecture.

---

### 5. Andy Hertzfeld
**Who:** Member of the original Macintosh development team. Wrote much of the original Mac system software in 128KB of RAM. Maintains folklore.org.

**Core Principles:**
- Constraints breed creativity -- limitations force elegant solutions
- Software is art; sign the inside of the case
- Demo or die -- make things real fast, prototype over planning
- Small teams, big ambitions
- Ship something revolutionary, not incremental

**What he'd critique in Recap:** The pattern detection system uses hardcoded keyword lists -- it works, but it's not elegant. He'd push for a smarter approach that learns from the actual data rather than matching against a static dictionary.

**What he'd praise:** The AI prompt system is the revolutionary idea here -- turning a blank weekly recap into a guided conversation. The pattern detection feeding back into prompts is a creative loop. The project itself was clearly built by a small team moving fast.

---

### 6. Mattt Thompson
**Who:** Creator of AFNetworking and NSHipster. Worked at Apple on developer documentation. Known for elevating the craft of iOS development through deep technical writing.

**Core Principles:**
- Know your tools deeply -- don't reinvent what the SDK already provides
- API design is user experience design
- Documentation is a first-class deliverable, not an afterthought
- Write prose, not just code -- commit messages, PR descriptions, and comments matter
- Embrace language idioms; write idiomatic TypeScript, not Java-in-TypeScript

**What he'd critique in Recap:** The `eslint-disable @typescript-eslint/no-explicit-any` comments in `auth.ts` are a code smell -- the NextAuth session types should be properly extended rather than cast to `any`. Type safety is a feature of the language; suppressing it undermines the whole point.

**What he'd praise:** The code is idiomatic TypeScript/Next.js. The Drizzle schema uses the type system well -- enums, proper nullable handling, typed references. The `generatePrompt` function is well-structured and readable.

---

### 7. Steve Troughton-Smith
**Who:** Prolific iOS/macOS developer and reverse engineer. Known for discovering unreleased Apple features and pushing platform boundaries.

**Core Principles:**
- Understand the system beneath the abstraction
- Push the platform's boundaries, don't just consume them
- Native is non-negotiable
- Keyboard shortcuts, menu bars, and platform conventions matter
- Be curious about how things work

**What he'd critique in Recap:** As a web app, this isn't his native territory -- but he'd ask whether a native app would serve store managers better. Store managers on iPads filling out weekly recaps might benefit from offline support, push notifications when their RM leaves feedback, and Shortcuts integration.

**What he'd praise:** The app respects the web platform's conventions. Server components are used appropriately for data fetching. The architecture doesn't fight Next.js -- it works with it.

---

### 8. Paul Hudson
**Who:** Creator of Hacking with Swift, the largest free Swift/iOS tutorial site. Author of dozens of books. Known for making complex topics accessible.

**Core Principles:**
- Clarity above cleverness -- readability over brevity
- Progressive disclosure of complexity
- Consistent naming and code style throughout a project
- Accessibility from the start, not as an afterthought
- Learn by building; theory without practice is incomplete

**What he'd critique in Recap:** The component naming uses abbreviations (`sm-view`, `rm-dashboard`) that require domain knowledge to parse. For a new developer joining the project, `store-manager-view` and `regional-manager-dashboard` would be immediately clear. Accessibility attributes are not visible in the components we reviewed.

**What he'd praise:** The code is readable and well-organized. The separation of concerns between actions, components, and lib is clean and consistent. The `Promise.all` parallel loading pattern is correctly applied and easy to follow.

---

### 9. Ray Wenderlich / Kodeco
**Who:** Founded the largest structured tutorial platform for iOS/Android development. Known for rigorous editorial processes and the widely-adopted Swift Style Guide.

**Core Principles:**
- Style guides matter -- enforce consistency across the codebase
- Code samples must compile and run; untested examples are broken examples
- Visual learning: use diagrams and screenshots in documentation
- Team-based quality control through thorough code review
- Keep current -- don't use deprecated APIs or outdated patterns

**What he'd critique in Recap:** Is there a contributing guide? A style guide? Linting rules enforced in CI? The codebase looks consistent, but is that enforced or just disciplined? He'd want ESLint + Prettier configs committed and enforced.

**What he'd praise:** The code is modern -- Next.js App Router with server components, Drizzle ORM, TypeScript throughout. No deprecated patterns visible. The schema uses current Drizzle conventions.

---

### 10. Chris Eidhof
**Who:** Co-founder of objc.io. Co-author of "Advanced Swift" and "Thinking in SwiftUI." Known for deep exploration of framework internals.

**Core Principles:**
- Understand the paradigm, not just the API
- Value types and immutability by default
- Functional composition: small, composable pieces over monolithic objects
- Architecture should emerge from the problem, not from dogma
- Deep knowledge over surface familiarity

**What he'd critique in Recap:** The `SmView` component is 242 lines and does data fetching, date calculation, prompt generation, data transformation, and rendering. It should be decomposed into smaller, composable pieces -- each with a single responsibility.

**What he'd praise:** The architecture emerged from the problem domain (store recaps flowing up to regional managers flowing up to area directors) rather than from an abstract pattern. The data flow is clear and follows the organizational hierarchy naturally.

---

### 11. Jony Ive
**Who:** Apple's former Chief Design Officer. Led the design of the iMac, iPod, iPhone, iPad, and Apple Watch. His design philosophy shaped the most successful consumer products in history.

**Core Principles:**
- Form follows intention, not convention
- Simplicity is the result of immense effort, not the removal of features
- Materials matter: typography, color, spacing, animation -- every value should be deliberate
- Reduce, reduce, reduce -- remove every unnecessary element
- Consistency creates trust; every screen should feel like the same app
- Obsess over transitions and animations

**What he'd critique in Recap:** Are the color choices deliberate or default Tailwind values? Is `text-muted-foreground` the right shade, or just "close enough"? He'd scrutinize every `px-8 py-8` and ask whether the spacing system is intentional. He'd want a motion design system -- how do cards appear? How do status badges transition?

**What he'd praise:** The interface is minimal and content-focused. The card-based layout for store recaps is clean. The use of badges for status is clear. The design doesn't compete with the user's content.

---

### 12. Linus Torvalds
**Who:** Creator of Linux and Git. Maintains the Linux kernel. Known for uncompromising technical standards and the principle "we do not break user space."

**Core Principles:**
- Good taste in code -- elegant structure that handles edge cases naturally, not special-case branches
- Performance matters at every level, but optimize what matters
- Simplicity and readability over cleverness
- Never break backward compatibility
- Data structures first, algorithms second
- Release early, release often

**What he'd critique in Recap:** The `THEME_KEYWORDS` pattern detection is a series of hardcoded special cases -- the exact opposite of "good taste." He'd want a data structure that makes the pattern matching extensible without modifying the code. He'd also note that the `getCurrentWeekEnding()` function is duplicated between `sm-view.tsx` and `rm-dashboard.tsx`.

**What he'd praise:** The database schema reflects good data structure thinking -- the relationships between regions, stores, managers, and recaps model the real organizational hierarchy cleanly. The foreign key relationships enforce integrity at the data level.

---

### 13. Algoriddim GmbH (djay)
**Who:** German company behind djay, one of the most technically impressive apps on Apple platforms. Known for deep hardware integration and real-time audio processing.

**Core Principles:**
- Leverage every hardware capability available
- Real-time performance is non-negotiable
- Professional tools with an accessible interface -- progressive disclosure
- Embrace platform ML capabilities for on-device processing
- Multi-platform but native per platform

**What they'd critique in Recap:** The pattern detection runs on static keyword lists rather than leveraging any ML capabilities. Even a simple TF-IDF or embedding-based similarity approach would be more robust. The app doesn't seem to use any on-device or server-side ML beyond the external AI chat prompt.

**What they'd praise:** The progressive disclosure model works -- SMs see a focused recap form, RMs see a dashboard with consolidated views, ADs see the market-level picture. Each role gets the right level of complexity.

---

### 14. Savage Interactive (Procreate)
**Who:** Australian company behind Procreate. Small team in Tasmania. Famous for rejecting subscriptions: "No subscriptions. Ever."

**Core Principles:**
- Tools should be owned, not rented -- no predatory subscription models
- Build custom engines when performance demands it
- The interface should get out of the way and let users focus on their work
- Independence and artistic integrity over investor-driven decisions
- Performance as creative enabler -- lag kills creativity

**What they'd critique in Recap:** Is the recap form fast enough that writing feels seamless? Any lag between typing and saving would break the writing flow. They'd also ask whether the AI prompt copy-paste workflow (copy prompt, go to ChatGPT, paste, converse, come back) is too many steps.

**What they'd praise:** The UI is minimal and focused. The card-based design doesn't compete with the recap content. The tool gets out of the way.

---

### 15. Tiimo
**Who:** Danish startup building a planning app specifically for neurodivergent users (ADHD, autism). Founded by people with lived experience of neurodivergence.

**Core Principles:**
- Design for neurodivergent minds first -- everyone benefits from low cognitive load
- Reduce cognitive load ruthlessly; every unclear label is a barrier
- Visual over textual where possible
- Gentle, not punishing -- no shame mechanics, no guilt streaks
- Routines should be flexible templates, not rigid prisons

**What they'd critique in Recap:** The weekly recap form could be overwhelming for a store manager with ADHD -- all questions visible at once, no visual progress indicator, no clear sense of "how much is left." The "submitted"/"draft"/"reviewed" badges are text-only with no color coding beyond Tailwind defaults.

**What they'd praise:** The AI prompt system that walks through questions one at a time is exactly the kind of guided, low-cognitive-load interaction they'd advocate. The pattern detection that surfaces recurring themes reduces the cognitive burden of remembering what you wrote last week.

---

### 16. Essayist Software Inc.
**Who:** Creator of Essayist, a writing app designed specifically for the essay-writing workflow rather than general-purpose text editing.

**Core Principles:**
- Specificity over generality -- build for one workflow and nail it
- Process-aware tools that understand workflow stages (outline, draft, revise, polish)
- Focus mode is the default mode
- Structure supports creativity -- scaffolding, not constraints
- The document is the focus; UI should recede

**What they'd critique in Recap:** The recap workflow has clear stages (draft, submit, review) but the interface doesn't visually distinguish between them. A draft recap and a submitted recap look the same except for a small badge. The writing experience could be more stage-aware.

**What they'd praise:** The app is built specifically for the weekly recap workflow. It's not a general-purpose note app -- it's purpose-built. The template system provides structure (questions) that scaffolds the writing process without constraining it.

---

### 17. Jensen Huang
**Who:** Co-founder and CEO of NVIDIA. Transformed a graphics card company into the engine of the AI revolution. Known for flat hierarchies, "light speed" execution, and betting on the future before it arrives.

**Core Principles:**
- Platform thinking -- build ecosystems, not just products
- Bet on the future before it arrives; invest now, not when it's obvious
- Speed of execution; flat org structure, no bureaucratic bottlenecks
- Intellectual honesty -- surface the hardest problems, don't hide them
- Full-stack optimization from hardware to application

**What he'd critique in Recap:** Is Recap thinking like a product or like a platform? Could the recap data, pattern detection, and prompt generation be an API that other tools consume? He'd push for thinking bigger about what this system enables beyond the current UI.

**What he'd praise:** The AI integration isn't cosmetic -- the prompt generation system with pattern detection and RM rules is a genuine intelligence layer. The investment in making the AI useful (not just present) is forward-thinking.

---

### 18. Demis Hassabis
**Who:** Co-founder and CEO of Google DeepMind. Child chess prodigy, neuroscience PhD, Nobel Prize winner for AlphaFold. Uniquely spans games, neuroscience, and AI research.

**Core Principles:**
- Fundamental research drives applied breakthroughs
- Interdisciplinary thinking -- breakthroughs happen at intersections
- Solve the right problem; build technology for important purposes
- Games and simulations are testbeds for intelligence
- Measure against ground truth with rigorous evaluation metrics

**What he'd critique in Recap:** How do you know the AI-assisted recaps are actually better than unassisted ones? Where is the ground truth? There are no metrics comparing recap quality before and after the AI prompt system. No A/B testing framework. No evaluation of whether pattern detection is accurate.

**What he'd praise:** The concept of detecting recurring themes across weeks and feeding them back into the prompt is a form of temporal reasoning -- the system learns from its own history. The hierarchical consolidation (SM to RM to AD) is a meaningful information architecture problem.

---

### 19. Dario Amodei
**Who:** Co-founder and CEO of Anthropic (creator of Claude). Former VP of Research at OpenAI. Known for Constitutional AI and thinking carefully about AI safety alongside capability.

**Core Principles:**
- Safety and capability are not in tension -- pursue both
- Constitutional AI: design systems around explicit principles rather than ad-hoc rules
- Empirical rigor -- validate with data, not intuition
- Interpretability: understand why a system behaves as it does
- Think about second-order effects of what you build

**What he'd critique in Recap:** The AI prompt is sent to an external chat system with no guardrails. What if the AI generates inappropriate content in a workplace recap? There are no content filters, no review of AI outputs, no constitutional constraints on what the AI should or shouldn't write. The prompt rules from RMs are freeform text with no validation.

**What he'd praise:** The system design is principled -- the prompt is constructed from explicit rules (RM themes, pattern flags, structured questions) rather than being a black box. The prompt is transparent and reviewable. The human (SM) is always in the loop.

---

### 20. Coleplay
**Who:** Indie game developer.

**Core Principles:**
- Small scope, high polish -- nail a focused experience
- Gameplay feel matters more than graphics
- Personal vision over market research and trend-chasing

**What they'd critique in Recap:** Are there rough edges that could be polished? Small things -- loading states, empty states, transition animations -- that signal care?

**What they'd praise:** The project has a clear personal vision: a specific tool for a specific workflow, not a generic platform trying to be everything.

---

### 21. Midjiwan (The Battle of Polytopia)
**Who:** Swedish indie studio behind The Battle of Polytopia. Distilled the 4X strategy genre into an elegant, accessible mobile format.

**Core Principles:**
- Distill, don't simplify -- remove noise to reveal depth, not remove depth itself
- Constraints as design tools; intentional limitations improve the experience
- Art style as functional design -- visuals should aid clarity, not just beauty
- Ethical monetization with no manipulative mechanics
- Compelling core loops that create "one more turn" engagement

**What they'd critique in Recap:** Is the weekly recap cadence a compelling loop? Does submitting a recap feel satisfying? Does getting RM feedback create a "one more week" motivation? The current flow is functional but may lack the emotional resonance that makes people want to engage.

**What they'd praise:** The system distills what could be an overwhelming management reporting process into a focused, structured weekly rhythm. The constraints (structured questions, weekly cadence) are design features, not limitations.

---

### 22. Team Alto (Alto's Adventure / Alto's Odyssey)
**Who:** Creators of Alto's Adventure and Alto's Odyssey -- widely considered among the most atmospheric games on mobile. Meditative snowboarding with dynamic weather and day/night cycles.

**Core Principles:**
- Atmosphere over mechanics -- mood matters as much as function
- One-thumb design; eliminate unnecessary interaction complexity
- Sound design is a pillar, not an afterthought
- Design for flow state; don't interrupt the user's rhythm
- Less is more; purity of experience is the point

**What they'd critique in Recap:** Does the app have any personality or atmosphere? Currently it reads as a functional business tool with no emotional character. The card designs, typography, and colors are competent but generic.

**What they'd praise:** The guided AI conversation approach is a form of flow design -- it walks the user through a process rather than confronting them with a blank page. The separation of concerns means each role's view is focused and uncluttered.

---

### 23. Chintan Patel
**Who:** Developer in the tech ecosystem (limited specific information available).

**Core Principles:**
- Build with platform-native best practices
- Clean architecture and separation of concerns
- Deliver value to users through thoughtful engineering

*Limited specific profile information available.*

---

### 24. Alexey Lebedev
**Who:** Developer (limited specific information available).

**Core Principles:**
- Technical craftsmanship in implementation
- Attention to detail in user-facing features

*Limited specific profile information available.*

---

### 25. Nathan Broadbent
**Who:** Founder of DocSpring (PDF generation API). Ruby on Rails developer, indie SaaS entrepreneur. Known for pragmatic, business-focused development.

**Core Principles:**
- Solve a boring but painful problem -- don't chase glamour
- Developer experience is the product when you're building tools
- Bootstrapped sustainability demands pragmatic technology choices
- Convention over configuration; leverage proven frameworks
- Reliability is paramount when others depend on your service
- Small team, big leverage through mature frameworks

**What he'd critique in Recap:** Is there proper error handling in the server actions? What happens when a database write fails? The `recap.ts` and `rm.ts` actions should have consistent error handling patterns. He'd also ask about deployment reliability -- CI/CD, staging environments, rollback procedures.

**What he'd praise:** Using Next.js, Drizzle, and Postgres is a pragmatic stack choice -- mature, well-documented, widely supported. No over-engineering, no unnecessary services. The monolith is the right architecture for this scale.

---

## Synthesized Principles

These 15 principles distill the collective wisdom of everyone above into actionable standards for the Recap project.

### 1. The architecture must match the actual scale
Do not introduce microservices, message queues, or distributed systems for a tool that serves dozens of users. A Next.js monolith with Postgres is correct. Defend simplicity. (Andreas, Torvalds, Broadbent)

### 2. Data structures are the foundation; get them right first
The database schema is the most important code in the project. Foreign keys, constraints, enums, and history tables protect data integrity at the lowest level. Review schema changes with the same rigor as security changes. (Torvalds, Siegel, Andreas)

### 3. Every component should have a single, clear responsibility
Views, actions, and library functions should be small and composable. A 242-line server component that fetches data, transforms it, generates prompts, and renders UI is doing too much. Decompose ruthlessly. (Eidhof, Arment, Midjiwan)

### 4. Type safety is not optional
TypeScript exists to catch errors at compile time. Every `as any` cast, every `eslint-disable`, every untyped function parameter is technical debt. Extend interfaces properly rather than casting around them. (Thompson, Eidhof, Torvalds)

### 5. Error handling is a first-class feature
Every database query, every server action, every API call needs explicit error handling. Silent `catch` blocks that return false are bugs. Users should see helpful error states, not blank screens or cryptic messages. (Andreas, Siegel, Broadbent)

### 6. The AI integration must be principled, not decorative
The prompt system should be transparent, reviewable, and constrained by explicit rules. Freeform RM prompt rules need validation. AI outputs entering the system should have guardrails. The human must always remain in the loop. (Amodei, Hassabis)

### 7. Reduce cognitive load for every user role
Store managers filling out weekly recaps are busy people. The interface should guide them step by step, show progress, minimize decisions, and never punish lateness. Design for the stressed, distracted, end-of-week user. (Tiimo, Ive, Essayist)

### 8. Measure what matters
If we claim pattern detection improves recaps, prove it. If we claim AI-assisted writing produces better summaries, measure it. Ship evaluation alongside features. Ground truth matters. (Hassabis, Amodei, Kodeco)

### 9. Consistency is trust
Same spacing system everywhere. Same card patterns everywhere. Same error handling pattern everywhere. Same naming conventions everywhere. When a new developer opens any file, they should feel like they've seen this codebase before. (Ive, Hudson, Kodeco)

### 10. Don't Repeat Yourself -- and mean it
`getCurrentWeekEnding()` should exist in exactly one place. Date formatting should be one utility. Error handling patterns should be one pattern. Duplication is a signal that an abstraction is missing. (Torvalds, Eidhof, Thompson)

### 11. Performance is felt before it is measured
The recap form should feel instant. Page loads should feel instant. Server actions should feel instant. Users don't check Lighthouse scores -- they feel sluggishness. Optimize perceived performance first, actual performance second. (Arment, Savage Interactive, Algoriddim)

### 12. Ship the workflow, not just the feature
Recap isn't a form -- it's a workflow with stages (draft, submit, review, consolidate, escalate). The UI should reflect where the user is in that workflow, what's expected of them, and what happens next. (Essayist, Tiimo, Midjiwan)

### 13. Build for extensibility without building extensions
The system should be structured so that adding a new question type, a new user role, or a new reporting level doesn't require rewriting existing code. Use enums, templates, and configuration where possible. (Soghoian, Huang, Broadbent)

### 14. Observability is not optional
If the consolidation prompt fails silently, how would we know? If pattern detection produces false positives, who sees them? Add structured logging, error tracking, and monitoring before the first user files a bug report they shouldn't have had to file. (Andreas, Broadbent, Siegel)

### 15. Craft the details
Typography, spacing, loading states, empty states, transition animations, badge colors, error messages -- these are not finishing touches. They are the product. Ship them with the same care as business logic. (Ive, Hertzfeld, Team Alto)

---

## Self-Assessment: Recap Project

### What we are doing well

**Architecture decisions are sound.** The choice of a Next.js monolith with Postgres/Drizzle is exactly right for this project's scale. There are no unnecessary services, no premature abstractions, no architecture astronautics. C. Scott Andreas, Nathan Broadbent, and Linus Torvalds would all approve.

**The database schema is thoughtful.** Proper foreign keys, history tracking tables (`storeRegionHistory`, `smStoreHistory`), enum types for statuses and roles, cascade deletes where appropriate. The data model mirrors the real organizational hierarchy cleanly. The schema reads like a specification of the business domain.

**The AI integration is genuinely useful.** The prompt generation system is not cosmetic. It assembles context (store name, questions, RM themes, pattern flags), structures a guided conversation, and produces something that actually helps store managers write better recaps. The pattern detection feedback loop -- where recurring themes from past recaps inform future prompts -- is a creative and useful feature.

**The role-based views are well-scoped.** Each role (SM, RM, AD) gets a focused view matched to their actual responsibilities. SMs write recaps and see peer stores. RMs see all their stores, consolidate, and communicate with ADs. The progressive disclosure model works.

**The tech stack is modern and pragmatic.** Server components for data fetching, client components for interactivity, Drizzle for type-safe database access, NextAuth for authentication. No deprecated patterns. The code is idiomatic.

### Where we fall short

**Type safety has gaps.** The `as any` casts in `auth.ts` for NextAuth session types are a known compromise. The NextAuth types should be properly extended via module augmentation. This is a solvable problem that we've deferred.

**Error handling is inconsistent.** The `entityExists` function in `page.tsx` has a bare `catch` that silently returns `false`, masking potential database connection errors. Server actions likely have similar gaps. There is no standardized error handling pattern across the codebase.

**Components are too large.** `SmView` (242 lines) and `RmDashboard` (274 lines) each handle data fetching, transformation, and rendering in one file. These should be decomposed into data-fetching layers and presentational components.

**No observability.** There is no structured logging, no error tracking service, no monitoring. If pattern detection produces false positives or the prompt generation fails, nobody would know unless a user reports it.

**No evaluation metrics.** We claim pattern detection surfaces recurring themes. Does it? How often are the detected themes accurate? How often does it miss real patterns? We have no measurement framework for the quality of our AI-adjacent features.

**Accessibility is underspecified.** The components reviewed show no explicit ARIA labels, no visible focus management, no Dynamic Type / font scaling considerations beyond what Tailwind provides by default. For a tool that store managers will use weekly, accessibility matters.

**Duplication exists.** `getCurrentWeekEnding()` is implemented independently in both `sm-view.tsx` and `rm-dashboard.tsx`. This should be a shared utility.

**Pattern detection is fragile.** The `THEME_KEYWORDS` approach using hardcoded keyword lists will miss synonyms, misspellings, and context. "We're stretched thin" doesn't match any staffing keyword even though it clearly means the same thing. This is the weakest technical component.

**No loading or empty states with care.** The empty state for past recaps is a plain text line: "No past recaps yet." For a tool that wants to guide users, this is a missed opportunity to explain what to do next. Loading states for the parallel data fetches are not visible in the server components.

### What we should prioritize improving

1. **Extract shared utilities.** Move `getCurrentWeekEnding()` and any other duplicated logic into `src/lib/`. This is a quick win that prevents drift.

2. **Standardize error handling.** Define a consistent pattern for server action errors. Replace silent catch blocks with explicit error states that surface to the UI. Add error boundaries to the React component tree.

3. **Decompose large components.** Break `SmView` and `RmDashboard` into smaller pieces: a data-fetching layer, a prompt-generation step, and presentational components. Each piece should be independently testable.

4. **Fix type safety gaps.** Extend the NextAuth types properly via module augmentation. Remove all `as any` casts. This prevents a category of runtime errors.

5. **Add structured logging.** Even a simple `console.error` with structured context (user ID, action, timestamp) would be an improvement. A proper logging service (Sentry, LogRocket, or similar) should follow.

6. **Evaluate pattern detection quality.** Run the keyword matcher against actual recap data and measure precision/recall. Consider whether a more robust approach (embeddings, fuzzy matching) is warranted, or whether the keyword list just needs expansion.

7. **Design loading and empty states.** Every data-dependent section should have a thoughtful loading state and an empty state that guides the user forward. These are not cosmetic -- they are part of the workflow.

8. **Audit accessibility.** Add ARIA labels, ensure keyboard navigation works throughout, verify color contrast ratios, and test with a screen reader. Store managers may have diverse needs.

---

*This is a living document. As the Recap project evolves, revisit these principles and the self-assessment. The goal is not perfection but continuous, honest improvement measured against the standards of people who have already proven what excellent software looks like.*
