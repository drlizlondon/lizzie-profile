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

/**
 * Use the modern clipboard first, then a synchronous browser fallback for
 * contexts where clipboard permissions are more restrictive.
 *
 * @param {string} value
 * @param {(value: string) => Promise<void>} primaryWrite
 * @param {(value: string) => boolean} fallbackWrite
 */
export const writeTextWithFallback = async (value, primaryWrite, fallbackWrite) => {
  try {
    await primaryWrite(value);
  } catch (primaryError) {
    if (fallbackWrite(value)) return;
    throw primaryError;
  }
};

/** @returns {(value: string) => Promise<void>} */
export const browserClipboardWriter = () => async (value) => {
  const modernWrite = navigator.clipboard?.writeText
    ? navigator.clipboard.writeText.bind(navigator.clipboard)
    : async () => { throw new Error('Clipboard access is unavailable.'); };

  await writeTextWithFallback(value, modernWrite, (fallbackValue) => {
    if (!document.body || typeof document.execCommand !== 'function') return false;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const textarea = document.createElement('textarea');
    textarea.value = fallbackValue;
    textarea.setAttribute('readonly', '');
    textarea.setAttribute('aria-hidden', 'true');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    textarea.setSelectionRange(0, fallbackValue.length);

    const copied = document.execCommand('copy');
    textarea.remove();
    previousFocus?.focus({ preventScroll: true });
    return copied;
  });
};
