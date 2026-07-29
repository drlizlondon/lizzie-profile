export const WATCH_SKILL_PATH = '/downloads/watch.zip';

/**
 * Build the prompt from the current site origin so it keeps working when the
 * portfolio moves to a custom domain.
 *
 * @param {string} origin
 */
export const buildWatchSetupPrompt = (origin) => {
  const skillUrl = new URL(WATCH_SKILL_PATH, origin).href;

  return `Please install Watch AI for me from ${skillUrl}.
Inspect it first. Add it as my user-level Codex skill named watch and set up everything it needs.
Before changing anything, explain it simply and ask for my approval. Do not overwrite an existing $watch skill.
Complete the setup and run the included check. Only when it passes, tell me exactly: "$watch is ready".
Then show me how to use:
$watch <video URL>
If setup cannot be completed here, explain the smallest next step.`;
};

/**
 * @param {(value: string) => Promise<void>} writeText
 * @param {string} origin
 */
export const copyWatchSetupPrompt = async (writeText, origin) => {
  try {
    await writeText(buildWatchSetupPrompt(origin));
    return true;
  } catch {
    return false;
  }
};
