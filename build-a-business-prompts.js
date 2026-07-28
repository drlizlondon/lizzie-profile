/** @param {any} value @param {string} placeholder */
const missing = (value, placeholder) => {
  if (Array.isArray(value)) return value.length ? value.join(', ') : `[${placeholder}]`;
  if (!value || /^(I’m not sure|I have not decided|Not decided|Skip this|Help me|I only have|I need a working name)/i.test(value)) return `[${placeholder}]`;
  return String(value).trim();
};

/** @param {any} value */
const summaryValue = (value) => {
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'To be confirmed.';
  if (!value || /^(I’m not sure|I have not decided|Not decided|Skip this|Help me|I only have|I need a working name)/i.test(value)) return 'To be confirmed.';
  return String(value).trim();
};

/** @param {Record<string, any>} answers */
const priceLine = (answers) => {
  if (answers.pricing === 'Yes, show the exact price') return missing(answers.price, 'exact price to be added');
  if (answers.pricing === 'Show “from” pricing') return `From ${missing(answers.price, 'starting price to be added')}`;
  return answers.pricing || '[pricing approach to be confirmed]';
};

/** @param {Record<string, any>} answers */
export const buildBusinessSummary = (answers) => `Business
${summaryValue(answers.businessName)}

What it does
${summaryValue(answers.idea)}

Who it is for
${summaryValue(answers.audience)}

What it helps with
${summaryValue(answers.problem)}

First offer
${summaryValue(answers.firstOffer)}${summaryValue(answers.offerType) === 'To be confirmed.' ? '' : ` (${summaryValue(answers.offerType)})`}

Main website action
${summaryValue(answers.primaryAction)}

Brand feel
${summaryValue(answers.traits)}`;

/** @param {Record<string, any>} answers */
export const buildLovablePrompt = (answers) => `Role

You are the lead product designer, brand strategist, copywriter and front-end architect.

Objective

Create a polished, mobile-first responsive website for the business below. Build the full first version now. Do not return only a plan or explanation, and do not ask unnecessary follow-up questions.

Business information

Business name: ${missing(answers.businessName, 'Use a clear temporary working title and make it easy to replace later')}
Business idea: ${missing(answers.idea, 'Business idea to be confirmed')}
Offer type: ${missing(answers.offerType, 'Offer type to be confirmed')}
Founder credibility and story: ${missing(answers.whyYou, 'Founder story and experience to be added')}
Personal story to mention: ${missing(answers.story, 'No additional personal story supplied')}
Operating area: ${missing(answers.locationType, 'Operating area to be confirmed')}${answers.location ? ` — ${answers.location}` : ''}

Audience

Primary audience: ${missing(answers.audience, 'Define one clear first customer group')}
Problem or desired result: ${missing(answers.problem, 'Problem or desired result to be confirmed')}

Offer

First offer: ${missing(answers.firstOffer, 'Use a simple placeholder first offer')}
What visitors should be able to do first: ${missing(answers.purchaseAction, 'Make an enquiry')}
Pricing approach: ${priceLine(answers)}

Primary action

The website must have one clear primary call to action: ${missing(answers.primaryAction, 'Enquire')}.

Brand and design direction

Brand traits: ${missing(answers.traits, 'Clear, friendly and trustworthy')}.
Visual style: ${missing(answers.visualStyle, 'Calm and clear')}.
Colour direction: ${missing(answers.colours, 'Choose colours that suit the selected visual style')}${answers.brandColours ? ` — supplied colours: ${answers.brandColours}` : ''}.
Image direction: ${missing(answers.images, 'Use restrained, relevant image placeholders')}.
Use warm, plain English. Avoid jargon and make the visitor feel confident about taking the next step.

Required website sections

Use these sections: ${missing(answers.websiteSections, 'Home, About, Services or products, How it works, Frequently asked questions, Contact')}.
Default to a polished one-page website unless the selected content clearly requires multiple pages. Keep the navigation short and obvious.
Contact methods: ${missing(answers.contactMethods, 'Use a working contact form interface with placeholder details')}.

Copy instructions

Use the supplied information to write clear, warm website copy. Keep all copy editable. Do not invent facts, unsupported claims, testimonials, customer numbers, qualifications, awards, prices or contact details. Use clearly labelled placeholders wherever information is missing. Do not present placeholders as real information.

Technical requirements

- Build mobile-first and make every layout fully responsive.
- Make the site accessible with semantic HTML, visible focus states, labelled controls, good contrast and reduced-motion support.
- Keep it fast-loading with no horizontal scrolling.
- Include clear navigation and a strong mobile call to action.
- Use editable content and reusable components.
- Use sensible spacing and polished empty states.
- Include a working contact form interface, but use placeholders for any unprovided destination or external link.
- Make mobile navigation keyboard accessible and easy to close.
- Do not add fake social proof or unsupported business claims.

Completion instruction

Build the full first version now. Produce a polished, usable website rather than only a plan or explanation.`;

/** @param {Record<string, any>} answers */
export const buildRefinementPrompt = (answers) => `# Improve My Business and Website Plan

Act as a practical business adviser, positioning strategist, conversion copywriter and website planner.

Review the founder information below with a supportive but honest eye.

Your goal is to help the founder create a business that is easier to understand and a website that is easier to buy from.

Do not invent qualifications, testimonials, customer numbers, results, prices or personal details.

Where information is missing, make sensible recommendations but clearly label them as suggestions.

Ask no more than three essential follow-up questions.

If answers are unavailable, continue using clearly labelled placeholders.

---

Review the information below.

Business idea: ${missing(answers.idea, 'Not yet clear')}
Offer type: ${missing(answers.offerType, 'Not yet clear')}
Target customer: ${missing(answers.audience, 'Not yet clear')}
Problem or desired result: ${missing(answers.problem, 'Not yet clear')}
Why this founder: ${missing(answers.whyYou, 'Not yet clear')}
Brand traits: ${missing(answers.traits, 'Not yet clear')}
First purchase action: ${missing(answers.purchaseAction, 'Not yet clear')}
First offer: ${missing(answers.firstOffer, 'Not yet clear')}
Pricing approach: ${priceLine(answers)}
Primary website action: ${missing(answers.primaryAction, 'Not yet clear')}
Requested website sections: ${missing(answers.websiteSections, 'Not yet clear')}
Visual style: ${missing(answers.visualStyle, 'Not yet clear')}
Colour direction: ${missing(answers.colours, 'Not yet clear')}${answers.brandColours ? ` — ${answers.brandColours}` : ''}
Image direction: ${missing(answers.images, 'Not yet clear')}
Business name: ${missing(answers.businessName, 'Working name needed')}
Operating area: ${missing(answers.locationType, 'Not yet clear')}${answers.location ? ` — ${answers.location}` : ''}
Contact methods: ${missing(answers.contactMethods, 'Not yet clear')}
Personal story: ${missing(answers.story, 'Not supplied')}

---

Produce your response in this order.

## 1. What I Understand

Briefly explain the business as you currently understand it.

Highlight any uncertainty.

---

## 2. What's Already Working

Identify the strongest parts of the idea.

---

## 3. What Needs Improving

Identify only the most important missing decisions.

For each:

• explain why it matters

• give an example of a stronger version

---

## 4. Suggested Improvements

Recommend improvements to:

• target customer

• first offer

• pricing approach (suggestions only)

• one-line business description

• primary call to action

---

## 5. Suggested Website Copy

Write improved copy for the requested website sections.

Never invent facts.

Use placeholders where required.

---

## 6. Questions

Ask up to three questions that would most improve the website.

---

## 7. Your Lovable Website Prompt

Finish by producing a complete Product Requirements Document inside ONE markdown copy block.

The document must be ready to paste directly into Lovable.

It should include:

• business summary

• target customer

• offer

• brand direction

• page structure

• navigation

• complete website copy

• design guidance

• accessibility requirements

• responsive behaviour

• technical requirements

• placeholders for missing information

The PRD should build the best possible website using confirmed information while clearly marking assumptions and placeholders.`;

export const firstWeekChecklist = [
  'Review your business summary.',
  'Paste your website prompt into Lovable.',
  'Replace any placeholder details.',
  'Add your real contact information.',
  'Test the website on your phone.',
  'Publish it using a domain you own.',
  'Send your website to one person who believes in you.',
];
