import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hashSync } from "bcryptjs";
import { sql } from "drizzle-orm";
import * as s from "./schema";

const DB_URL = process.env.DATABASE_URL!;
const db = drizzle(neon(DB_URL), { schema: s });
const pw = hashSync("password", 10);

// ── Helpers ────────────────────────────────────────────────────

function weekEnding(weeksAgo: number): string {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + daysUntilSunday - weeksAgo * 7);
  return sunday.toISOString().split("T")[0];
}

// ── Store data ─────────────────────────────────────────────────

const RM_DATA = [
  {
    name: "James Wong",
    email: "james@recap.test",
    stores: [
      { name: "Central Store", address: "1 Queen's Road Central", sm: { name: "Amy Liu", email: "amy@recap.test" } },
      { name: "Causeway Bay", address: "500 Hennessy Road", sm: { name: "Kevin Tam", email: "kevin@recap.test" } },
      { name: "TST Harbour", address: "18 Salisbury Road, TST", sm: { name: "Rachel Ng", email: "rachel@recap.test" } },
      { name: "Admiralty Pacific", address: "88 Queensway", sm: { name: "Daniel Fung", email: "daniel@recap.test" } },
    ],
  },
  {
    name: "Michelle Lai",
    email: "michelle@recap.test",
    stores: [
      { name: "Mong Kok Langham", address: "8 Shanghai Street, MK", sm: { name: "Chris Ho", email: "chris@recap.test" } },
      { name: "Olympic City", address: "1 Hoi Wang Road", sm: { name: "Samantha Yip", email: "sam@recap.test" } },
      { name: "Sha Tin New Town", address: "18 Sha Tin Centre Street", sm: { name: "Jason Cheng", email: "jason@recap.test" } },
      { name: "Tuen Mun Town", address: "1 Tuen Shun Street", sm: { name: "Vivian Kwok", email: "vivian@recap.test" } },
    ],
  },
  {
    name: "Tony Chan",
    email: "tony@recap.test",
    stores: [
      { name: "ifc Mall", address: "8 Finance Street, Central", sm: { name: "Grace Lau", email: "grace@recap.test" } },
      { name: "K11 Musea", address: "18 Salisbury Road, TST", sm: { name: "Marcus Yeung", email: "marcus@recap.test" } },
      { name: "Elements", address: "1 Austin Road West, Kowloon", sm: { name: "Fiona Cheung", email: "fiona@recap.test" } },
      { name: "Cityplaza", address: "18 Tai Koo Shing Road", sm: { name: "Paul Siu", email: "paul@recap.test" } },
    ],
  },
];

// ── Weekly recap answers by SM "personality" ───────────────────

type WeekAnswers = Record<string, string[]>; // questionIndex -> answers per week (0=4wks ago, 3=this week)

// Each SM has a personality that affects their writing style and themes
const SM_ANSWERS: Record<string, WeekAnswers> = {
  // --- James's stores ---
  "amy@recap.test": {
    q1: [
      "Hit 92% of target. Traffic was strong Monday-Wednesday but dropped off Thursday onwards due to the rain. Conversion was 18% which is below our 22% benchmark. Average basket was solid at $1,850.",
      "Came in at 97% of target — best week this month. Weekend traffic was exceptional with the long weekend. Conversion lifted to 21%. We had three $5k+ transactions which helped.",
      "Missed target at 88%. Two team members called in sick Tuesday and Wednesday which killed our midweek momentum. Traffic was actually up 5% but we couldn't convert without enough bodies on floor.",
      "On pace for 94% as of Saturday. Traffic patterns are normalizing. Conversion is back to 20% after last week's staffing issues. Team energy feels better this week.",
    ],
    q2: [
      "Accessories outperformed by 35% — the new collection launch drove a lot of interest. Our top educator Emily sold $12k solo this week which is a personal best.",
      "Men's category was up 28%. The new training line is resonating. Also our community events drove 15 new guest profiles this week.",
      "Nothing really stood out this week honestly. We hit plan in women's but that was about it.",
      "Guest experience scores came back at 94 for the month. Outerwear is moving well ahead of the season change. Emily continues to crush it — $10k again this week.",
    ],
    q3: [
      "Conversion is our biggest gap. We're getting the traffic but not closing. I think the team needs more confidence in the fitting room experience. Also inventory gaps in core sizes (6-8) are hurting us.",
      "Still struggling with conversion in the afternoon shift. The newer team members aren't as comfortable with the full guest journey. Size gaps in core leggings persist — we've been out of Align 6 for three weeks.",
      "Conversion again. The team is tired and it shows in the afternoon. I notice they're not greeting as proactively. Also we're still missing Align sizes 6 and 8. Guests are walking out.",
      "Conversion is still the main opportunity. We ran a team session on Tuesday focusing on fitting room flow and I'm seeing early improvement. Still waiting on Align restock — this is week four without sizes 6-8.",
    ],
    q4: [
      "Running a conversion challenge this week — team paired up as accountability buddies. Also planning a product knowledge session on the new running line.",
      "Continuing the conversion focus. Planning to shadow newer educators during peak and give real-time coaching. Need to follow up on Align restock with inventory team.",
      "Morale boost is the priority. Planning a team outing on Wednesday evening. Then getting back to conversion fundamentals with the afternoon crew.",
      "Keeping the momentum from Tuesday's session. Goal is to sustain 20%+ conversion through the week. Also prepping for the seasonal floor set next week.",
    ],
    q5: [
      "Launch is tracking well — we've sold through 40% of initial buy in week one. Guests love the colorway but asking for more sizing in the cropped styles.",
      "Slowed down a bit, sold through 55% total. Some color fatigue in the hero styles. Guests asking when the next drop lands.",
      "Sold through at 68%. The remaining stock is mostly size 2 and 12 which are slower moving. A couple of guests mentioned seeing it discounted at the outlet.",
      "Nearly sold through at 82%. Successful launch overall. Guests now asking about the holiday collection — good energy around newness.",
    ],
    q6: [
      "Team is doing well overall. Emily is ready for a key leader conversation. Marcus on the afternoon shift needs more support with product knowledge.",
      "Emily had her key leader development chat — she's keen. Marcus improved this week after our 1:1. Two new hires starting next Monday.",
      "The team is really tired. Long hours covering for sick calls last two weeks. I can see it in their energy. Morale needs attention. New hires orientation went well though.",
      "Energy is better this week after the team outing. New hires are settling in. Emily is taking on more leadership naturally — letting her run morning huddles.",
    ],
  },
  "kevin@recap.test": {
    q1: [
      "Crushed it — 108% to target. Causeway Bay foot traffic was insane with the festival weekend. Every shift was packed.",
      "Back to earth at 95%. Festival hangover — traffic down 15% from last week. Still a solid week but the comparison hurts.",
      "91% of target. Quiet midweek but weekend recovered. There's construction outside the entrance which I think is affecting walk-ins.",
      "96% target. Steady week. The construction hoarding came down on Thursday and we immediately saw an uptick Friday-Saturday.",
    ],
    q2: [
      "Everything. Men's +40%, women's +25%, accessories +50%. The festival crowd was spending freely. Three transactions over $8k.",
      "Our community class Saturday had 30 attendees — biggest ever. Converted 12 of them to same-day purchases. That's the model.",
      "Online pickup orders were strong — 45 BOPIS transactions. Guests are discovering us through the app and coming in to try on more.",
      "Women's run category up 32%. The marathon is 6 weeks out and we're becoming the go-to prep store. Booked 8 bra fittings this week.",
    ],
    q3: [
      "Honestly not much — it was just a great week. If I had to pick something, our back stock is a mess from the volume. Need a full restock day.",
      "The drop-off from festival week is demoralizing for the team. They're comparing every day to last week's numbers which isn't helpful. Need to reset expectations.",
      "Construction has been killing us for 3 weeks now. Foot traffic is down and there's nothing we can do about it. Team morale is affected because they feel like they can't hit target regardless of effort.",
      "Want to capitalize on the marathon traffic but our running wall is understocked. Need more of the Speed Up tight and the Blissfeel in narrow widths.",
    ],
    q4: [
      "Back stock blitz on Monday before open. Then business as usual — riding the momentum.",
      "Team reset meeting Monday. Focusing on controllables — conversion, basket size, guest connection. Can't control traffic so stop worrying about it.",
      "Running a marathon activation event Saturday with the local running crew. Should drive targeted traffic. Also doing a visual refresh of the run wall.",
      "Marathon prep push — partnering with two running clubs for the next 6 weeks. Goal is to be known as THE run destination in the district.",
    ],
    q5: [
      "Hot launch — sold through 50% in the festival rush. Could have done more with better size coverage.",
      "Slowed as expected post-festival. At 62% sell-through. Still healthy.",
      "Sitting at 70%. Not much movement this week. Might need to feature it more prominently.",
      "78% sold through. Steady. Moving the remaining units to the front table this week.",
    ],
    q6: [
      "Team crushed it this week and morale is sky high. Enjoying it while it lasts. Sarah earned educator of the month.",
      "Had to have honest conversations with 2 team members about attitude after the post-festival slump. It's normal but can't let it fester.",
      "Construction frustration is real. I've been transparent with the team about what we can and can't control. It's landing but they're still frustrated.",
      "Energy is back. The marathon activation has everyone excited — they feel like we're building something, not just selling. Good culture moment.",
    ],
  },
  "rachel@recap.test": {
    q1: [
      "86% to target. Tough week. TST tourist traffic hasn't recovered to pre-holiday levels and the local crowd seems to be spending cautiously.",
      "84% to target. Another tough one. I'm starting to wonder if the area is in a spending downturn or if it's us.",
      "89% — slight improvement. Ran a VIP event Thursday evening that brought in some bigger transactions. Without that we'd have been 82%.",
      "87% to target. Consistent but consistently below plan. We need to have an honest conversation about whether this target is realistic for TST right now.",
    ],
    q2: [
      "VIP client segment is still performing. Our top 20 guests account for 40% of revenue. That loyalty is real.",
      "Men's accessories had a good week — up 15%. Bag sales specifically. Tourist purchases when they do come in are high-value.",
      "The VIP event was a hit — 18 guests attended, $28k in revenue that evening alone. Proves the model works when we curate the experience.",
      "Our Instagram presence is growing — 400 new followers this month. Starting to see guests mention they found us on social. That's new for this store.",
    ],
    q3: [
      "Traffic. Plain and simple. We're down 20% on foot traffic compared to same period last year. The TST area is struggling and we feel it.",
      "Same story — traffic is the bottleneck. We can convert at 25% (our best in the district) but if nobody walks in, the math doesn't work.",
      "I keep saying traffic but nobody upstream seems to be hearing me. We need either a marketing push for TST specifically, or a realistic conversation about targets. The team is demoralized hitting 85% when they're actually doing great work.",
      "Traffic still down. But I want to flag — the team is starting to disengage. When you consistently miss target despite doing everything right, people stop trying. I need help with this.",
    ],
    q4: [
      "Doubling down on VIP. Building out a client outreach program — personal invites, exclusive previews. If traffic won't come to us, we go to them.",
      "VIP outreach continues. Also partnering with the hotel concierge at the Peninsula for referrals. Testing the waters.",
      "Hotel partnership is live — got 3 referrals this week. Small but promising. Planning another VIP event for next month.",
      "Focusing on what we can control — client relationships, social media presence, hotel partnerships. But I really need the target conversation to happen.",
    ],
    q5: [
      "Slow. Only 25% sell-through. Our guests aren't responding to this particular colorway — it doesn't suit the local preference.",
      "30% sell-through. Moved some units by pairing with complementary pieces. Not a natural fit for our guest profile.",
      "35%. It's a miss for this store. The guests who did buy were tourists.",
      "38%. Writing this one off as a learnings opportunity. Our buy for next season should reflect local color preferences better.",
    ],
    q6: [
      "Team is solid but I can sense the frustration. We talk about it openly. They know they're doing good work even if the numbers don't show it.",
      "Lost one educator to the Central store — she wanted to be somewhere busier. I get it. Down to minimum staffing now.",
      "Hired a replacement but she's brand new and needs full onboarding. The team is stretched thin covering the gap.",
      "New hire Jenny is picking things up fast. The team has rallied around training her which is actually good for morale. Sometimes having someone to teach lifts everyone.",
    ],
  },
  "daniel@recap.test": {
    q1: [
      "101% to target. Admiralty lunch crowd is our bread and butter — corporate professionals shopping on break. Like clockwork.",
      "103% to target. Consistent as always. This store runs itself honestly. The location and the guest profile just work.",
      "99% — essentially on plan. Nothing dramatic. One slow Wednesday but made it up Saturday.",
      "102% to target. Steady. Not exciting but reliable. We're the tortoise, not the hare.",
    ],
    q2: [
      "ABC pants continue to dominate in this location — up 20% YOY. The office crowd can't get enough. Also strong in Commission shirts.",
      "Women's On The Move collection doing well with the corporate women. 15 bra fittings this week — lots of first-timers discovering the brand through workwear.",
      "Repeat purchase rate is at 45% — highest in the district. Our guests come back. That's the story here.",
      "Lunchtime express styling sessions are booking out — we offer 15-minute focused styling for professionals and it's our secret weapon. 8 sessions this week, 100% conversion.",
    ],
    q3: [
      "Weekend traffic is our weak spot. The area empties out when the offices close. Not sure how to crack it.",
      "Same weekend gap. We're a weekday store in a weekday neighborhood. Might need to accept that and optimize for it rather than fight it.",
      "Nothing major. Inventory is solid, team is stable, guests are happy. Weekend traffic remains low but that's structural.",
      "The only real opportunity is cracking the weekend. Thinking about running weekend-specific programming — maybe a Saturday morning run club to bring people to the area.",
    ],
    q4: [
      "Piloting a corporate partnership program — offering styling sessions to nearby offices. First one booked with a law firm for next Tuesday.",
      "Corporate styling went great — 8 attendees, $6k in sales from one session. Booking two more this month.",
      "Expanding corporate program. Have 4 offices on the waitlist. Also launching a loyalty program exclusive to Admiralty guests.",
      "Corporate program is now self-sustaining — offices are referring other offices. Focus this week is executing the Saturday run club pilot.",
    ],
    q5: [
      "Solid 45% sell-through. Our guests like it but buy selectively — they know what works for their lifestyle.",
      "58% sell-through. Steady movement. This store always sells through at a measured pace — no spikes, no drops.",
      "70%. Clean. Will be sold through by end of month at this rate.",
      "80%. On track. Nothing to flag.",
    ],
    q6: [
      "Team is stable and experienced. No issues. Planning development conversations for Q2.",
      "Two educators expressed interest in key leader roles. Good problem to have. Setting up development plans for both.",
      "Development plans in motion for both candidates. Team overall is in a good rhythm — low drama, high execution.",
      "Running a team skills workshop next week. Even a strong team can sharpen. Focus areas: advanced styling and guest storytelling.",
    ],
  },

  // --- Michelle's stores ---
  "chris@recap.test": {
    q1: [
      "93% of target. Mong Kok is always chaotic but we're learning to ride the wave. Weekends are our game — 60% of revenue in 2 days.",
      "97% of target. Getting closer. Saturday was record-breaking at $18k. The street culture vibe is pulling a younger demo.",
      "95% — solid middle ground. Consistent traffic but the conversion challenge continues with the browsing crowd.",
      "98% — almost there. The younger demographic is converting better as we adjust our approach. Less hard sell, more storytelling.",
    ],
    q2: [
      "Streetwear-adjacent styles are flying — the oversized fits, the bold colors. This crowd knows what they want.",
      "Social media-driven sales are up. Guests are coming in asking for specific items they saw on Instagram. We need to lean into this.",
      "The weekend energy is unmatched. Our music playlist and store vibe attract people off the street. 3 walk-ins became $2k+ transactions.",
      "We've become a destination. I overheard guests telling their friends 'you have to check out the Mong Kok store.' That's brand building.",
    ],
    q3: [
      "Conversion with the browsing crowd. Mong Kok has massive foot traffic but a lot of it is window shopping. We convert at 12% vs district average of 20%.",
      "Still the conversion gap. We're getting better at qualifying guests early but the sheer volume of browsers skews the numbers.",
      "Shrinkage is creeping up. High traffic, tight store, lots of hands on product. Need to address this without killing the open, accessible vibe.",
      "Conversion improved to 15% but still below district. Also the fitting room wait time on weekends is 15+ minutes which is costing us sales.",
    ],
    q4: [
      "Testing a greeter role on weekends — someone at the door to qualify traffic and direct genuine shoppers. Hoping it lifts conversion.",
      "Greeter role helped. Conversion on Saturday was 16%. Scaling it to both weekend days. Also implementing a fitting room queue system.",
      "Addressing shrinkage with better floor coverage patterns. Don't want to add security — it kills the vibe. Training team on subtle loss prevention.",
      "Fitting room queue is digital now — guests scan a QR code and get a text when a room is ready. They can keep shopping. Game changer.",
    ],
    q5: [
      "Hot. 55% sell-through. The younger crowd loves the colorway. Lots of social media posts from guests wearing it in-store.",
      "65% and still moving fast. This was a perfect match for our demographic.",
      "75%. Nearly done. Could have sold more with deeper sizes in XS and S — our guests skew smaller.",
      "82%. Our best launch sell-through this year. Need to communicate the sizing skew for future buys.",
    ],
    q6: [
      "Young team, high energy, but need development on selling skills. They're great at vibes but less polished on closing.",
      "Running role-plays this week on closing techniques. The team is receptive — they want to grow.",
      "One team member is struggling with reliability. Two no-shows this month. Having the conversation this week.",
      "Had the reliability conversation — set clear expectations. The rest of the team is progressing well on sales skills.",
    ],
  },
  "sam@recap.test": {
    q1: [
      "90% to target. Olympic City is a family area and our weekday traffic is light. Weekends carry us.",
      "88% to target. School holiday ended and we felt it immediately. Back to the weekday drought.",
      "85% to target. Third week below 90. I'm concerned about the trend. The area doesn't have enough weekday foot traffic to sustain our targets.",
      "87%. Slight uptick but still below plan. Ran a kids' yoga event Saturday that brought families in.",
    ],
    q2: [
      "Kids and family-sized transactions. When families come, they spend. Average family transaction is $3,200 — that's mom, dad, and at least one kid.",
      "Our Saturday morning kids' programming has a loyal following — 20+ families every week. It's our pipeline.",
      "Community is our strength. We know our regulars by name. Three families this week bought for upcoming holidays.",
      "The kids' yoga event was our best community moment yet. 25 families, tons of social sharing, and $8k in same-day revenue.",
    ],
    q3: [
      "Weekday traffic is our achilles heel. Monday to Thursday we're basically staffing an empty store. It's hard on morale.",
      "Same weekday problem. We're overstaffed Mon-Thu and understaffed Sat-Sun. Need to rebalance but people want consistent hours.",
      "Weekday traffic continues to be the issue. We've tried everything — promotions, events, social media. The area just doesn't have weekday footfall.",
      "I need to flag that the weekday situation is affecting retention. Team members want hours but sitting in an empty store isn't fulfilling. Lost one person last month to a busier location.",
    ],
    q4: [
      "Exploring a weekday workshop series for stay-at-home parents. Yoga, run club, sweat sessions. Build a reason to come.",
      "Weekday workshops launching next week. Partnered with a local studio for instructors. Low cost, high potential.",
      "Workshops are attracting 8-12 people per session. Small but they're buying. It's a start. Need to scale.",
      "Shifting to a lean weekday model — fewer staff, lower costs, workshop-driven traffic. Putting resources into weekend maximization.",
    ],
    q5: [
      "35% sell-through. Slower here — our guest isn't as trend-driven. They buy functional over fashion.",
      "40%. Steady but not exciting. Pairing it with family-friendly messaging helped a bit.",
      "45%. Adequate. This guest wants to see it on someone who looks like them — featuring real parents in our displays.",
      "50%. The real-parent display approach worked. Authentic representation matters here more than anywhere.",
    ],
    q6: [
      "Good team but bored on weekdays. I try to use the quiet time for development but there's only so many training modules you can do.",
      "Team morale is mixed. Weekends they're energized, weekdays they're deflated. I'm trying to bridge the gap.",
      "Lost Jen to the Causeway Bay store — she wanted more action. Can't blame her. Hiring to replace.",
      "New hire training during the quiet weekdays is actually a silver lining. They get tons of attention and ramp up fast.",
    ],
  },
  "jason@recap.test": {
    q1: [
      "105% to target. Sha Tin is booming. The new residential developments are bringing in young professionals who are exactly our demographic.",
      "108% — another strong week. We're riding a wave of new residents discovering the store. First-time guest rate is 30%.",
      "104%. Still performing but the explosive growth is normalizing. Good problem — means our base is building.",
      "106%. The growth story continues. We now have the highest first-time-to-repeat conversion in the region at 38%.",
    ],
    q2: [
      "New guest acquisition. 30% of transactions this week were first-timers. The area is growing and we're capturing them.",
      "Women's running is explosive — up 45% YOY. The new residential area has a massive running culture. We're their local shop.",
      "Repeat rate climbing. Our CRM outreach is working — personalized texts after first purchase driving 25% return within 30 days.",
      "We launched a 'Welcome to the Neighbourhood' package for new residents — 10% off first purchase plus a local run club invite. 22 redemptions this week.",
    ],
    q3: [
      "Growing pains — we need more staff to handle the volume but hiring approval is slow. Currently running lean.",
      "Staffing still the bottleneck. We turned away 3 bra fitting requests Saturday because no one was available. That's lost revenue.",
      "Need more fitting room capacity. We have 2 rooms for a store that's doing the volume of a 4-room location. Guests are waiting or leaving.",
      "Submitted the business case for store expansion. In the meantime, we're using the stockroom as a makeshift 3rd fitting room during peak.",
    ],
    q4: [
      "Pushing for hiring approval — we need 2 more headcount minimum. Also planning a community run event with the local athletics club.",
      "Community run is booked for Saturday. 50 RSVPs already. This is how we cement ourselves as the neighborhood store.",
      "Post-event follow up. Community run had 65 attendees. Generated $12k in sales from a $200 event investment. Doing it monthly.",
      "Monthly run club is locked in. Building the event calendar for next quarter. Focus is sustainable community building, not one-offs.",
    ],
    q5: [
      "Great — 50% sell-through. New guests are buying in bundles since they're building their wardrobe from scratch.",
      "62%. Strong for a new area store. Bundle approach is working.",
      "72%. Will sell through ahead of schedule.",
      "85%. Top performer in the region for this launch. The new-resident wardrobe-building effect is real.",
    ],
    q6: [
      "Team is high energy but burning out from the volume. I need those extra heads. Can't sustain this pace with 6 people.",
      "Got approval for 1 additional headcount. Need 2 but I'll take it. Starting interviews this week.",
      "New hire starting Monday. Team is relieved. Still running hot but at least there's light at the end of the tunnel.",
      "New team member is ramping up well. The experienced team is mentoring naturally. Culture here is strong — people want to be here.",
    ],
  },
  "vivian@recap.test": {
    q1: [
      "94% to target. Tuen Mun is steady — not flashy but reliable. Our regulars keep us grounded.",
      "93%. Similar to last week. There's a ceiling effect in this area — the spending power is there but discretionary fashion isn't the priority.",
      "91%. Dipped slightly. A competitor opened 2 floors up in the mall and is running aggressive promotions. We felt it.",
      "95%. Recovered a bit. The competitor buzz is dying down — their product doesn't match ours. Guests are coming back.",
    ],
    q2: [
      "We Are From and essentials are our bread and butter. This guest buys functional. ABC pants and Align leggings all day.",
      "Guest loyalty is remarkable here — 55% repeat rate. They don't browse, they buy what they know. Efficient transactions.",
      "Our community yoga class has a cult following. 30 regulars, rain or shine. It feeds directly into sales.",
      "Essential restock purchases are up 20%. Our guests replace their favorite items regularly. Predictable revenue stream.",
    ],
    q3: [
      "Newness penetration is low. Our guests stick with what they know and resist trying new styles. Getting them to explore is hard.",
      "Same challenge with newness. I've tried displays, educator recommendations, outfit pairing — they still gravitate to the same 5 SKUs.",
      "The competitor opening has made some guests price-conscious. A few have mentioned seeing 'similar' products for less. We need to reinforce our value story.",
      "Need to refresh our approach to newness. Maybe a 'style challenge' concept where loyal guests try one new thing per visit?",
    ],
    q4: [
      "Testing a 'What's New Wednesday' where we highlight one new product with an educator demo. Low effort, might crack the newness barrier.",
      "What's New Wednesday had 8 participants. Small but 5 of them bought. 62% conversion on newness — the personal touch matters.",
      "Leaning into the value story against the competitor. Training team on fabric technology and durability messaging. Our stuff lasts — that's the pitch.",
      "Style challenge concept launching next week. Regulars get a personalized 'try this' recommendation based on their purchase history.",
    ],
    q5: [
      "28% sell-through. Lowest in the district. Our guests didn't connect with the colorway.",
      "32%. Marginal improvement. Tried to position it as 'versatile for everyday' but the core guest isn't biting.",
      "34%. Essentially stalled. Will likely need markdowns to clear.",
      "36%. Slow but I've accepted it. Sharing feedback with the buying team for future assortment planning.",
    ],
    q6: [
      "Small but mighty team. Low turnover because they're all from the local area and genuinely care about the community.",
      "Team is stable. Used the quiet week for deep product knowledge training. They can now tell the full story of every fabric.",
      "One team member asked about development opportunities. There's not much upward mobility in a small store — might need to help her explore other locations.",
      "Had an honest conversation about growth paths. She's going to shadow at Central Store for a day next month to see if a move makes sense.",
    ],
  },

  // --- Tony's stores ---
  "grace@recap.test": {
    q1: [
      "112% to target. ifc is premium territory and our guests don't flinch at price. Average transaction is $3,400.",
      "109%. Slightly softer but still well above plan. A few of our VIP clients are traveling so we felt their absence.",
      "115%. Best week of the quarter. A corporate event upstairs drove massive traffic. Three transactions over $10k.",
      "111%. Consistent strength. This store delivers. The premium positioning pays for itself.",
    ],
    q2: [
      "Premium accessories and outerwear. Our guest buys the top of the range every time. Bag sales alone were $15k this week.",
      "Personal shopping appointments — 12 this week, average spend $4,200. Our concierge service is a competitive advantage.",
      "The corporate event spillover was incredible. Executives shopping between sessions. We had champagne and personal styling ready.",
      "International guest spend is climbing. Hong Kong as a shopping destination is recovering. We're seeing mainland Chinese clients return.",
    ],
    q3: [
      "Honestly, hard to find complaints. Stock depth on premium items could be better — we sold out of the cashmere blend in 2 days.",
      "Appointment scheduling could be smoother. We're using paper still. Need a digital booking system.",
      "Premium stock-outs are costing us. When a $400 item sells out, we can't just substitute. This guest wants what they want.",
      "Reliance on VIP clients is a double-edged sword. When they travel, we feel it. Need to broaden the base slightly.",
    ],
    q4: [
      "Requesting deeper buys on premium SKUs. Also exploring a digital appointment system — looking at a few options.",
      "Digital booking is live! Using a simple Calendly setup. Already getting bookings from our VIP WhatsApp group.",
      "Building a 'next tier' client program to identify high-potential guests and develop them into VIPs. Pipeline thinking.",
      "Next-tier program identified 15 candidates. Starting personal outreach this week. Also requesting premium stock buffer for next quarter.",
    ],
    q5: [
      "65% sell-through. Premium guest buys early and buys full price. Best launch performance in the district.",
      "75%. Moving fast. Will be sold through within days.",
      "88%. Essentially sold through. Had waitlist requests from 3 clients who missed out.",
      "Sold through. 100%. The question now is whether we can get replenishment for the demand we couldn't meet.",
    ],
    q6: [
      "Elite team. Everyone here is experienced and polished. We invest heavily in styling and client relationship skills.",
      "Team dinner this week to celebrate the quarter. Retention is 100% for the past 18 months. They're well compensated and they know their worth.",
      "One educator is being poached by a luxury competitor. Having a retention conversation. We need to match or she's gone.",
      "Retention conversation went well — she's staying. Had to advocate hard for a compensation adjustment. Worth it — she's a $500k/year producer.",
    ],
  },
  "marcus@recap.test": {
    q1: [
      "98% to target. K11 Musea is a beautiful space but the mall traffic is curated — fewer people but higher intent.",
      "102%. Cracked plan this week. The art exhibition next door drove an upscale crowd that naturally wandered in.",
      "96%. Quiet week. The mall had maintenance on our floor which reduced visibility. Poor timing.",
      "100%. Right on target. K11 is a consistency play — we won't spike but we rarely dip.",
    ],
    q2: [
      "Our store design is itself a selling point. Guests come to experience the space. Three this week said it was the best retail environment they'd been in.",
      "Art x retail crossover is working. We hosted a local artist for a live painting session in-store. Drove massive social engagement.",
      "Guest quality is exceptional. Average spend per guest is second only to ifc. When people shop here, they invest.",
      "Visual merchandising continues to set us apart. The buying team visited and used our displays as reference for the brand guidelines.",
    ],
    q3: [
      "Foot traffic is lower than traditional malls. K11 Musea is a destination, not a drive-by. We need every guest to count.",
      "Struggle to attract the casual browser. Our guests are intentional but we miss the impulse buy opportunity that busier locations get.",
      "The floor maintenance was frustrating — lost 2 days of prime visibility. Need better communication from mall management.",
      "Our community programming is harder here because the mall has strict event guidelines. Every activation needs 3 weeks of approval.",
    ],
    q4: [
      "Focusing on conversion optimization. If every guest counts, we need to be world-class at every interaction.",
      "Launching a styling showcase weekend — invite-only, curated looks. Lean into the exclusivity of the space.",
      "Following up with mall management on event approval streamlining. Also testing after-hours private shopping events.",
      "Private shopping pilot was excellent — 6 guests, $22k revenue in 2 hours. Scaling to twice monthly.",
    ],
    q5: [
      "42% sell-through. Good but measured. Our guest buys thoughtfully.",
      "55%. Steady. The art event helped — people were in a buying mood after the cultural experience.",
      "60%. On pace. No concerns.",
      "72%. Will sell through by target date. Clean inventory position.",
    ],
    q6: [
      "Team of 5 — small but perfectly suited to the environment. They're brand ambassadors more than sales associates.",
      "Team had a brand immersion day. Understanding the art and culture connection helps them connect with our specific guest profile.",
      "Morale is good. This team self-selects — people who work here love the aesthetic and the pace. Low stress, high quality.",
      "One educator is developing a personal following on social media — 2k followers who come specifically to see her style recommendations. That's an asset.",
    ],
  },
  "fiona@recap.test": {
    q1: [
      "95% to target. Elements is solid but not spectacular. The transit hub aspect means lots of passing traffic but less dwell time.",
      "99%. So close. A strong Saturday pushed us to the edge. The cinema crowd in the evening helped.",
      "92%. Midweek was dead. The MTR disruption on Wednesday literally cut off our traffic for half a day.",
      "97%. Good recovery. Weekend was strong with the food festival in the mall driving extended dwell time.",
    ],
    q2: [
      "Grab-and-go purchases are our strength. The commuter knows exactly what they want, comes in, buys it, leaves. Sub-5-minute transactions.",
      "Evening cinema crowd is an untapped goldmine. They have 20 minutes to kill before the movie. We converted 15 of them this week.",
      "BOPIS is strong — 38 pickup transactions. Commuters order online and grab on their way through. Frictionless.",
      "The food festival brought families who don't normally visit our floor. Converted 8 first-timers. Cross-pollination with mall events works.",
    ],
    q3: [
      "Dwell time is our challenge. People are passing through, not hanging out. Hard to do full guest experiences in a transit hub.",
      "The store layout needs rethinking for the grab-and-go model. Current setup assumes browsing — we need fast-access zones.",
      "MTR disruptions are unpredictable and devastating. When they happen, traffic drops 50% instantly. No way to plan around it.",
      "Competition from online is real here more than other stores. The commuter guest is already on their phone — if we're not the easiest option, they'll just order.",
    ],
    q4: [
      "Proposing a 'quick picks' front zone — curated essentials right at the entrance for the grab-and-go guest. No browsing required.",
      "Quick picks zone approved. Working with visual to set it up this week. Hero products, clear pricing, scan-and-pay option.",
      "Quick picks zone is live. Early feedback is positive — 12 transactions from the zone in 3 days. Guests love the convenience.",
      "Expanding quick picks based on data. The top sellers are ABC pants, Align leggings, and Everywhere Belt Bag. Making these always-available.",
    ],
    q5: [
      "38% sell-through. Average for us. The transit guest isn't here for newness — they're here for replenishment.",
      "42%. Slow movers in this location. We're not a discovery store.",
      "46%. Marginal improvement by positioning it in the quick picks zone.",
      "50%. Respectable given our guest profile. The quick picks positioning helped more than traditional merchandising.",
    ],
    q6: [
      "Team is efficient. They've adapted to the pace — fast service, minimal downtime. But I worry about development stagnating.",
      "Rotating team through development workshops at other stores. They need exposure to different selling environments.",
      "Two team members did their rotation at ifc. They came back with elevated styling skills. Worth the investment.",
      "Team requested more rotations. Setting up a quarterly exchange program with ifc and K11. Builds skills and cross-store relationships.",
    ],
  },
  "paul@recap.test": {
    q1: [
      "91% to target. Cityplaza is a family mall but we're competing with a lot of retail noise. Need to stand out more.",
      "93%. Marginal improvement. Saturday community event helped close the gap.",
      "90%. Flat. The area is reliable but not growing. We need a catalyst.",
      "94%. Best week this month. Combination of community programming and a strong weekend.",
    ],
    q2: [
      "Family transactions are our strength — similar to Olympic City. When a family of 4 walks in, average spend is $2,800.",
      "Community yoga Saturday had 35 attendees. It's become a neighborhood institution. 40% of attendees purchased something.",
      "We're known as the community store. People come for the vibe as much as the product. That's brand equity you can't buy.",
      "Kids' programming is a pipeline — parents wait while kids are in the activity, and they shop. Genius format that emerged organically.",
    ],
    q3: [
      "Standing out in a crowded mall. Cityplaza has 200+ stores. We need to be the destination, not a stop along the way.",
      "Our entrance visibility is poor — we're on the 3rd floor off the main escalator path. Signage needs improvement.",
      "Tried to get better signage placement from mall management. Denied. Frustrating — we're paying premium rent for secondary visibility.",
      "Need to compensate for poor visibility with digital presence. Our Google Maps listing and mall directory need attention.",
    ],
    q4: [
      "Investing in community to build word-of-mouth since visibility is limited. If people know us, the location doesn't matter as much.",
      "Expanding community programming — adding a weekday morning run club for the parent crowd after school drop-off.",
      "Morning run club had 12 participants first session. Perfect target demo. Follow-up texts driving store visits.",
      "Community flywheel is working: events → relationships → word of mouth → new guests. Doubling down on this model.",
    ],
    q5: [
      "33% sell-through. Slower here. Our guest doesn't chase trends — they buy when they need something.",
      "38%. Moved a few more units by featuring it at the community event.",
      "42%. Steady. Nothing alarming but not exciting.",
      "48%. Will sell through by end of season. Acceptable for this location.",
    ],
    q6: [
      "Team turnover is my concern. Lost 2 people this quarter to better-paying retail jobs. Hiring is tough in this area.",
      "Still one person short. The team is covering but it's not sustainable. Offering referral bonuses to current team.",
      "Hired through a referral — current educator's friend. Cultural fit is immediately better than typical hires.",
      "New hire is settling in well. Team stability is improving. Planning a team appreciation day next week — they've earned it.",
    ],
  },
};

// Standard questions (must match what we'll create)
const STANDARD_QUESTIONS = [
  "How did the overall week perform against targets? What drove the result?",
  "What metrics or areas outperformed expectations this week?",
  "Where are the biggest opportunities or underperforming areas? What's the plan?",
  "What is the team's focus moving forward this coming week?",
];

const STORE_QUESTIONS = [
  "How is the new product launch tracking in your store? Any customer feedback?",
  "How is team morale and development progressing? Any callouts?",
];

async function seed() {
  console.log("Clearing existing data...");
  // Delete in dependency order
  await db.delete(s.adNote);
  await db.delete(s.recapLineItem);
  await db.delete(s.recapAnswer);
  await db.delete(s.recapQuestion);
  await db.delete(s.recapTemplate);
  await db.delete(s.promptRule);
  await db.delete(s.recap);
  await db.delete(s.consolidatedRecap);
  await db.delete(s.smStoreHistory);
  await db.delete(s.storeRegionHistory);
  await db.delete(s.user);
  await db.delete(s.sm);
  await db.delete(s.store);
  await db.delete(s.rm);
  await db.delete(s.ad);
  await db.delete(s.region);

  console.log("Creating org structure...");

  // Region
  const [region] = await db
    .insert(s.region)
    .values({ name: "Hong Kong", country: "HK" })
    .returning();

  // AD
  const [adRecord] = await db
    .insert(s.ad)
    .values({ name: "Sarah Chen", email: "ad@recap.test", regionId: region.id })
    .returning();

  await db.insert(s.user).values({
    email: "ad@recap.test",
    passwordHash: pw,
    role: "ad",
    entityId: adRecord.id,
  });

  // RMs, Stores, SMs
  const rmRecords: Record<string, typeof s.rm.$inferSelect> = {};
  const storeRecords: Record<string, typeof s.store.$inferSelect> = {};
  const smRecords: Record<string, typeof s.sm.$inferSelect> = {};

  for (const rmData of RM_DATA) {
    const [rmRecord] = await db
      .insert(s.rm)
      .values({ name: rmData.name, email: rmData.email, adId: adRecord.id, regionId: region.id })
      .returning();
    rmRecords[rmData.email] = rmRecord;

    await db.insert(s.user).values({
      email: rmData.email,
      passwordHash: pw,
      role: "rm",
      entityId: rmRecord.id,
    });

    console.log(`  RM: ${rmData.name} (${rmData.email})`);

    for (const storeData of rmData.stores) {
      const [storeRecord] = await db
        .insert(s.store)
        .values({ name: storeData.name, address: storeData.address, regionId: region.id })
        .returning();
      storeRecords[storeData.sm.email] = storeRecord;

      const [smRecord] = await db
        .insert(s.sm)
        .values({ name: storeData.sm.name, email: storeData.sm.email, storeId: storeRecord.id })
        .returning();
      smRecords[storeData.sm.email] = smRecord;

      await db.insert(s.user).values({
        email: storeData.sm.email,
        passwordHash: pw,
        role: "sm",
        entityId: smRecord.id,
      });

      console.log(`    Store: ${storeData.name} → SM: ${storeData.sm.name} (${storeData.sm.email})`);
    }

    // Create templates for each RM
    const [stdTemplate] = await db
      .insert(s.recapTemplate)
      .values({
        templateType: "standard",
        name: "Weekly Store Recap",
        rmId: rmRecord.id,
        effectiveFrom: "2026-01-01",
        active: true,
      })
      .returning();

    const stdQuestionRecords = await db
      .insert(s.recapQuestion)
      .values(
        STANDARD_QUESTIONS.map((q, i) => ({
          templateId: stdTemplate.id,
          questionText: q,
          questionType: "text" as const,
          sortOrder: i + 1,
          required: true,
        }))
      )
      .returning();

    // Store-specific template for each store
    for (const storeData of rmData.stores) {
      const storeRecord = storeRecords[storeData.sm.email];
      const [storeTemplate] = await db
        .insert(s.recapTemplate)
        .values({
          templateType: "store_specific",
          name: `${storeData.name} — Focus Areas`,
          rmId: rmRecord.id,
          storeId: storeRecord.id,
          effectiveFrom: "2026-01-01",
          active: true,
        })
        .returning();

      const storeQuestionRecords = await db
        .insert(s.recapQuestion)
        .values(
          STORE_QUESTIONS.map((q, i) => ({
            templateId: storeTemplate.id,
            questionText: q,
            questionType: "text" as const,
            sortOrder: i + 1,
            required: i === 0,
          }))
        )
        .returning();

      // Create 4 weeks of recaps for this SM
      const smEmail = storeData.sm.email;
      const smRecord = smRecords[smEmail];
      const answers = SM_ANSWERS[smEmail];

      if (answers) {
        for (let week = 3; week >= 0; week--) {
          const we = weekEnding(week);
          const status = week === 0 ? "submitted" : "submitted";

          const [recapRecord] = await db
            .insert(s.recap)
            .values({
              weekEnding: we,
              status,
              smId: smRecord.id,
              storeId: storeRecord.id,
            })
            .returning();

          // Map answers to questions
          const weekIndex = 3 - week; // 0=oldest, 3=newest
          const answerValues = [];

          // Standard questions
          for (let qi = 0; qi < stdQuestionRecords.length; qi++) {
            const key = `q${qi + 1}`;
            answerValues.push({
              recapId: recapRecord.id,
              questionId: stdQuestionRecords[qi].id,
              answerText: answers[key]?.[weekIndex] ?? `Answer for question ${qi + 1}, week ${we}`,
            });
          }

          // Store-specific questions
          for (let qi = 0; qi < storeQuestionRecords.length; qi++) {
            const key = `q${stdQuestionRecords.length + qi + 1}`;
            answerValues.push({
              recapId: recapRecord.id,
              questionId: storeQuestionRecords[qi].id,
              answerText: answers[key]?.[weekIndex] ?? `Store-specific answer ${qi + 1}, week ${we}`,
            });
          }

          await db.insert(s.recapAnswer).values(answerValues);
        }
        console.log(`    → 4 weeks of recaps created for ${smEmail}`);
      }
    }

    // Add prompt rules
    await db.insert(s.promptRule).values({
      rmId: rmRecord.id,
      ruleType: "theme",
      value: "Focus on conversion rate improvement and guest experience this quarter.",
      active: true,
    });
  }

  // ── Create consolidated recaps for each RM ─────────────────
  console.log("\nCreating RM consolidated recaps...");

  const RM_SUMMARIES: Record<string, string[]> = {
    "james@recap.test": [
      "Mixed week across the 4 stores. Central (92%) and Causeway Bay (108%) are bookends — CB crushed it with the festival while Central battles conversion. TST continues to struggle at 86% and I'm hearing Rachel's frustration about traffic loud and clear — we need to either adjust targets or invest in marketing for that location. Admiralty is the quiet achiever at 101%. Key theme: conversion is the district-wide opportunity. Amy at Central is making progress with accountability buddies but we need a systemic approach. The Align size gaps are now in their third week — escalating to supply chain.",
      "Steadier week. Central 97%, CB 95%, TST 84%, Admiralty 103%. Central's improvement is encouraging — the long weekend helped but the conversion work is bearing fruit too. CB is normalizing post-festival which is expected. TST dropped further and Rachel lost an educator to Central — I need to address the talent drain from struggling stores. Admiralty continues to quietly deliver. The community events across stores are a bright spot — CB's 30-person class and Amy's conversion challenge show the team is thinking creatively. Concern: TST is becoming a morale problem, not just a traffic problem.",
      "Central 88% (sick calls), CB 91% (construction), TST 89% (VIP event saved it), Admiralty 99%. A challenging week with external factors hitting us. The good news: Rachel's VIP event at TST proved the high-touch model works — $28k from 18 guests is remarkable. Construction at CB is frustrating Kevin's team but should resolve soon. Central's staffing issue exposed our thin bench — two sick calls shouldn't crater a week. Action items: advocate for TST target adjustment, follow up on CB construction timeline, build Central's bench strength.",
      "Improving trajectory. Central 94%, CB 96%, TST 87%, Admiralty 102%. The construction came down at CB and we immediately saw uplift. Central's conversion session is showing early results — Amy is developing as a leader by coaching her own team. TST remains stuck but Rachel's hotel partnerships and social media growth show entrepreneurial thinking. I want to highlight: Daniel at Admiralty is building a corporate partnerships model that could scale across the district. And Emily at Central is ready for key leader. Concern: Align restock still outstanding — week four.",
    ],
    "michelle@recap.test": [
      "Good energy across the New Territories stores this week. Mong Kok 93% — Chris is figuring out how to convert the browsing crowd. Olympic 90% — the weekday traffic issue persists. Sha Tin 105% — Jason's growth story continues, the new residential area is a gift. Tuen Mun 94% — Vivian's community loyalty is her strength. District theme: each store has a very different personality and needs a tailored approach. I'm encouraged by the creativity — Chris's greeter role, Sam's weekday workshops, Jason's community runs, Vivian's What's New Wednesday. These are smart, local solutions.",
      "Mong Kok 97% (festival recovery), Olympic 88% (post-holiday dip), Sha Tin 108% (new guests flooding in), Tuen Mun 93%. Sha Tin is the star — 30% first-time guest rate is phenomenal. The challenge is Jason needs more staff and we're slow on hiring approval. Olympic's school holiday ending exposed the weekday problem again — Sam needs a structural solution, not just events. Chris at Mong Kok is building a street culture brand within the brand — it's working but the conversion gap persists. Vivian at Tuen Mun is rock-steady.",
      "Mong Kok 95%, Olympic 85% (third week below 90), Sha Tin 104%, Tuen Mun 91% (competitor pressure). The Olympic situation concerns me — Sam flagged that it's affecting retention and I believe her. We need a lean weekday model there. The competitor near Tuen Mun is a short-term threat but Vivian's community loyalty should hold. Mong Kok's shrinkage issue needs addressing carefully — Chris is right that security kills the vibe. Sha Tin's fitting room bottleneck is costing us — submitted the expansion business case.",
      "Mong Kok 98%, Olympic 87%, Sha Tin 106%, Tuen Mun 95%. Trending in the right direction. Chris's digital fitting room queue is innovative — every store should look at this. Sam is pivoting to a lean weekday model which I fully support. Jason got his first additional hire and the team is relieved. Vivian's style challenge concept is smart — personalized newness introduction for a guest who resists change. My proudest moment: every SM in my district is solving their own problems with creative, local solutions. That's the culture I want.",
    ],
    "tony@recap.test": [
      "Premium district delivered again. ifc 112% (Grace's team is elite), K11 Musea 98% (quality over quantity), Elements 95% (transit hub challenges), Cityplaza 91% (visibility struggles). Grace at ifc is in a different league — $3,400 average transaction. Marcus at K11 is building something special with the art-retail crossover. Fiona at Elements has an interesting grab-and-go insight that could redefine how we think about transit locations. Paul at Cityplaza is fighting a visibility war. Theme: each store has a distinct model and we should stop applying one playbook.",
      "ifc 109%, K11 102%, Elements 99%, Cityplaza 93%. K11 cracked plan thanks to the art exhibition — Marcus is proving that cultural programming drives premium retail. Fiona almost hit plan despite being in a transit hub — her cinema crowd insight is genius. Grace's VIP pipeline at ifc is a well-oiled machine but we're vulnerable to client travel patterns. Paul's community approach at Cityplaza is building, slowly. Concern: Grace flagged a retention risk — a luxury competitor is poaching. We need to retain our best people, not just our best guests.",
      "ifc 115% (corporate event windfall), K11 96% (floor maintenance disruption), Elements 92% (MTR disruption), Cityplaza 90%. ifc had a monster week but that's not sustainable — the corporate event was a one-off. K11 and Elements both lost days to building/transit issues we can't control. Paul at Cityplaza is frustrated with signage rejection from mall management — I'll escalate. The quick picks zone at Elements is a genuine innovation — Fiona launched it this week and it's already converting. I want to present this as a model for transit locations company-wide.",
      "ifc 111%, K11 100%, Elements 97%, Cityplaza 94%. Strong finish to the month. Grace retained her key educator — had to fight for compensation adjustment but it's worth it for a $500k producer. Marcus's private shopping events are a scalable model for premium locations. Fiona's quick picks zone is data-driven and expanding. Paul's community flywheel is working — events → relationships → word of mouth → new guests. Each store is developing a distinct competitive advantage. My focus next month: cross-pollinate these innovations across the district.",
    ],
  };

  for (const rmData of RM_DATA) {
    const rmRecord = rmRecords[rmData.email];
    const summaries = RM_SUMMARIES[rmData.email];

    for (let week = 3; week >= 0; week--) {
      const we = weekEnding(week);
      const weekIndex = 3 - week;

      const [consolidated] = await db
        .insert(s.consolidatedRecap)
        .values({
          weekEnding: we,
          summary: summaries[weekIndex],
          status: "submitted",
          rmId: rmRecord.id,
          adId: adRecord.id,
        })
        .returning();

      // Link store recaps to consolidated
      for (const storeData of rmData.stores) {
        const smRecord = smRecords[storeData.sm.email];
        const storeRecord = storeRecords[storeData.sm.email];

        // Find the recap for this week
        const [recapRecord] = await db
          .select()
          .from(s.recap)
          .where(
            sql`${s.recap.smId} = ${smRecord.id} AND ${s.recap.storeId} = ${storeRecord.id} AND ${s.recap.weekEnding} = ${we}`
          )
          .limit(1);

        if (recapRecord) {
          await db.insert(s.recapLineItem).values({
            consolidatedRecapId: consolidated.id,
            recapId: recapRecord.id,
          });
        }
      }

      console.log(`  ${rmData.name} consolidated recap for ${we}`);
    }
  }

  console.log("\nDone! Test accounts (password: password):");
  console.log("  AD:  ad@recap.test");
  for (const rm of RM_DATA) {
    console.log(`  RM:  ${rm.email}`);
    for (const store of rm.stores) {
      console.log(`  SM:  ${store.sm.email} (${store.name})`);
    }
  }
}

seed().catch(console.error);
