export const STORAGE_KEY = 'lizprofile.build-a-business.v1';
export const BOOKING_URL = '';

export const sections = [
  { id: 'idea', label: 'Your idea', start: 0, end: 3 },
  { id: 'founder', label: 'About you', start: 4, end: 5 },
  { id: 'offer', label: 'Your first offer', start: 6, end: 8 },
  { id: 'purpose', label: 'Your website', start: 9, end: 10 },
  { id: 'visual', label: 'Look and feel', start: 11, end: 13 },
  { id: 'details', label: 'Business details', start: 14, end: 16 },
  { id: 'story', label: 'Your story', start: 17, end: 17 },
];

export const questions = [
  {
    id: 'idea', type: 'text', required: true,
    question: 'What are you thinking of starting?',
    placeholder: 'For example: a cake business, coaching for new mums, private tutoring, a healthcare consultancy…',
    quickChoices: ['I only have a rough idea'],
  },
  {
    id: 'offerType', type: 'single', required: true, question: 'What will you mainly offer?',
    options: ['A service', 'A physical product', 'A digital product', 'Classes or events', 'Advice or consultancy', 'Membership or subscription', 'A mixture', 'I’m not sure yet'],
  },
  {
    id: 'audience', type: 'text', required: true, question: 'Who is it mainly for?',
    helper: 'Try to describe one type of person rather than everyone.',
    placeholder: 'For example: busy parents, first-time mums, healthcare teams or local families…',
    quickChoices: ['I’m not sure yet'],
  },
  {
    id: 'problem', type: 'textarea', required: true, question: 'What problem are you helping them solve?',
    helper: 'What becomes easier, better, quicker, safer or more enjoyable because your business exists?',
    quickChoices: ['Help me work this out later'],
  },
  {
    id: 'whyYou', type: 'textarea', required: true, question: 'Why are you a good person to do this?',
    helper: 'Think about your experience, qualifications, personal story, local knowledge, professional background, lived experience, skill or hobby.',
    quickChoices: ['I’m still building my confidence'],
  },
  {
    id: 'traits', type: 'multi', required: true, max: 3, question: 'How should the business feel?',
    helper: 'Choose up to three.',
    options: ['Clear', 'Calm', 'Friendly', 'Premium', 'Professional', 'Bold', 'Fun', 'Modern', 'Elegant', 'Warm', 'Trustworthy', 'Playful', 'Simple', 'Creative', 'Reassuring'],
  },
  {
    id: 'purchaseAction', type: 'single', required: true, question: 'What do you want people to be able to buy or book first?',
    options: ['Book a call', 'Book a service', 'Buy a product', 'Join a waiting list', 'Request a quote', 'Send an enquiry', 'Join a class or event', 'Download something', 'I’m not sure yet'],
  },
  {
    id: 'firstOffer', type: 'text', required: true, question: 'What is your first offer?',
    placeholder: 'For example: a one-hour consultation, personalised cake order or four-week coaching package…',
    quickChoices: ['Help me keep this simple'],
  },
  {
    id: 'pricing', type: 'single', required: true, question: 'Do you want to show a price?',
    options: ['Yes, show the exact price', 'Show “from” pricing', 'Ask people to enquire', 'Offer a free first call', 'I have not decided yet'],
    followUp: { id: 'price', label: 'What price would you like to show?', when: ['Yes, show the exact price', 'Show “from” pricing'], placeholder: 'For example: £75 or £25 per month' },
  },
  {
    id: 'primaryAction', type: 'single', required: true, question: 'What should the website help someone do?',
    helper: 'Choose the one most important action.',
    options: ['Book', 'Buy', 'Enquire', 'Join a waiting list', 'Learn more', 'Contact me', 'Request a quote', 'Follow me', 'Download something'],
  },
  {
    id: 'websiteSections', type: 'multi', required: true, question: 'What pages or sections do you need?',
    helper: 'We have preselected a simple starting set. Change anything you like.',
    defaults: ['Home', 'About', 'Services or products', 'How it works', 'Frequently asked questions', 'Contact'],
    options: ['Home', 'About', 'Services or products', 'How it works', 'Frequently asked questions', 'Contact', 'Pricing', 'Testimonials', 'Portfolio', 'Gallery', 'Blog', 'Events', 'Resources', 'Booking', 'Shop'],
  },
  {
    id: 'visualStyle', type: 'visual', required: true, question: 'What should the website feel like?',
    options: [
      ['Cool and modern', 'Clean layout, confident typography, crisp spacing.'],
      ['Calm and clear', 'Soft colours, generous white space, easy to understand.'],
      ['Pretty and elegant', 'Refined typography, polished details, gentle visual style.'],
      ['Warm and friendly', 'Welcoming colours, human language, approachable layout.'],
      ['Bold and confident', 'Large headlines, strong contrast, energetic design.'],
      ['Fun and playful', 'Bright personality, informal style, friendly shapes.'],
      ['Premium and minimal', 'Sophisticated, restrained and high-end.'],
      ['Professional and trustworthy', 'Structured, credible and reassuring.'],
    ],
  },
  {
    id: 'colours', type: 'single', required: true, question: 'Do you have colours in mind?',
    options: ['Let the website choose based on my style', 'I have brand colours', 'Neutral colours', 'Soft colours', 'Bright colours', 'Dark and sophisticated'],
    followUp: { id: 'brandColours', label: 'Add colour names or hex codes', when: ['I have brand colours'], placeholder: 'For example: navy, cream and #D98B73' },
  },
  {
    id: 'images', type: 'multi', required: true, question: 'What type of images would suit the website?',
    options: ['Photos of me', 'Photos of my work', 'Product photography', 'Lifestyle images', 'Illustrations', 'Simple icons', 'Minimal or no images', 'I’m not sure yet'],
  },
  {
    id: 'businessName', type: 'text', required: true, question: 'What should the business be called?',
    quickChoices: ['I need a working name'],
  },
  {
    id: 'locationType', type: 'single', required: true, question: 'Where does the business operate?',
    options: ['Online', 'Locally', 'Across the UK', 'Internationally', 'A mixture'],
    followUp: { id: 'location', label: 'Add a location if useful', when: ['Locally', 'A mixture'], placeholder: 'For example: South London' },
  },
  {
    id: 'contactMethods', type: 'multi', required: true, question: 'How should people contact you?',
    helper: 'You do not need to enter your real contact details now.',
    options: ['Contact form', 'Email', 'Telephone', 'WhatsApp', 'Booking link', 'Instagram', 'LinkedIn', 'Not decided yet'],
  },
  {
    id: 'story', type: 'textarea', required: false, question: 'Is there anything personal you would like the website to mention?',
    helper: 'For example, why you started, your experience, or what you care about.',
    quickChoices: ['Skip this'],
  },
];

/** @param {Record<string, any>} question @param {any} value */
export const guidanceFor = (question, value) => {
  if (question.id === 'audience' && typeof value === 'string' && /everyone|anyone|all people/i.test(value)) {
    return 'Starting with one clear type of customer often makes a new business easier to explain. You can always grow later.';
  }
  if (question.id === 'pricing' && ['Ask people to enquire', 'I have not decided yet'].includes(value)) {
    return 'That is fine. Your first website can invite people to enquire while you test the offer.';
  }
  if (question.id === 'businessName' && value === 'I need a working name') {
    return 'A working name is enough to begin. You do not need to solve everything before building.';
  }
  return '';
};
