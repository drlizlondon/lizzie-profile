/** @type {Record<string, [string, string, string]>} */
const projects = {
  bumpnotes: ['BumpNotes', 'Pregnancy records that support better conversations.', 'Verified project details and visuals will be added here.'],
  aurelle: ['Aurelle', 'Learning by doing, not just reading.', 'Verified project details and visuals will be added here.'],
  'result-doctor': ['Result Doctor', 'Clearer results. More confident decisions.', 'Verified project details and visuals will be added here.'],
  'mission-control': ['Mission Control', 'Complex systems made easier to understand.', 'Verified project details and visuals will be added here.'],
  'common-ground': ['Common Ground', 'Better questions. Stronger connections.', 'Verified project details and visuals will be added here.'],
  'big-picture-planner': ['Big Picture Planner', 'See your week. Focus on what fits.', 'Verified project details and visuals will be added here.'],
};

const slug = location.pathname.split('/').pop()?.replace('.html', '') ?? '';
const project = projects[slug];
if (project) {
  const [name, summary, detail] = project;
  document.title = `${name} — Dr Lizzie Soyode`;
  const nameElement = document.querySelector('[data-project-name]');
  const summaryElement = document.querySelector('[data-project-summary]');
  const detailElement = document.querySelector('[data-project-detail]');
  if (nameElement) nameElement.textContent = name;
  if (summaryElement) summaryElement.textContent = summary;
  if (detailElement) detailElement.textContent = detail;
}
