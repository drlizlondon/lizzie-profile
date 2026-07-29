---
name: watch
description: Watch and discuss public Instagram, TikTok, YouTube, or X videos and local video files by inspecting representative frames and a transcript. Use when a user invokes $watch, shares a video link, or asks Codex to watch, analyse, summarise, verify, or explain a video.
---

# Watch a video

Turn a video into visual evidence and a transcript, then explain what it contains, what matters, and what remains uncertain.

## Accept the video

- Treat `$watch <video URL>` and equivalent requests as URL mode.
- Accept explicit local video paths by skipping the download step.
- Process multiple videos separately so their files and evidence never become mixed.
- Do not bypass a private account, paywall, platform restriction, or access control.
- Discuss the video first. Do not implement an idea from it unless the user asks.
- If the user includes one of the partial-video command examples below, follow the placeholder behaviour instead of processing the whole video.

## First-time setup

Use this section when installing the skill or when a required component is missing.

1. Run the bundled check from this skill directory:

   ```bash
   python3 scripts/watch_setup.py
   ```

2. If anything is missing, explain the proposed changes in plain language and ask once for approval before installing them.
3. Install only missing components. Do not use `sudo`, install a system package manager, edit shell profiles, overwrite an existing skill, or access browser cookies without separate explicit permission.
4. On macOS, when Homebrew is already available and the user has approved setup, install missing command-line components with:

   ```bash
   brew install yt-dlp ffmpeg whisper-cpp
   ```

   If Homebrew is absent, explain that first and ask separately before installing it. On Windows or Linux, use current official sources and the trusted package manager already available on that computer; do not invent package names when uncertain.

5. Prefer the multilingual base model. Respect `WHISPER_MODEL_PATH` when configured. Otherwise store it in the standard user cache:

   ```bash
   mkdir -p "$HOME/.cache/whisper-cpp"
   curl -L --fail \
     -o "$HOME/.cache/whisper-cpp/ggml-base.bin" \
     https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin
   ```

6. Run `python3 scripts/watch_setup.py` again, followed by `python3 scripts/watch_smoke_test.py`.
7. Say exactly `$watch is ready` only when both checks pass. If this Codex environment cannot install software or reach the download source, explain the smallest next step without claiming success.

## Check length before downloading

Run the bundled preflight from the skill directory before downloading the full video:

```bash
python3 scripts/watch_preflight.py --url '<URL>'
```

For a local file, run:

```bash
python3 scripts/watch_preflight.py --file '<video-path>'
```

The script returns one of `normal`, `long`, `very_long`, or `unknown`.

Evaluate `very_long` before `long`:

- `normal` means 20 minutes or less. Continue without a warning.
- `long` means more than 20 minutes and no more than 60 minutes. Pause before the full download and use the long-video confirmation below.
- `very_long` means more than 60 minutes. Pause before the full download and use the over-an-hour confirmation below.
- `unknown` means the duration could not be confirmed. Explain that briefly and ask whether to try, using `Watch it` and `Cancel`.

### More than 20 minutes

Say exactly:

> Heads up, this is a longer video, so it'll take a little longer to watch.
>
> Carry on?

Offer these choices:

- `Watch it`
- `Cancel`

### More than 60 minutes

Say exactly:

> That's quite a commitment. 😄
>
> This video is over an hour long, so downloading, transcribing and analysing it could take a while.
>
> Are you sure you'd like me to watch the whole thing?

Offer these choices:

- `Yes, watch everything`
- `Analyse part of it instead`
- `Cancel`

Use structured choice controls when the current Codex surface provides them. Otherwise present the same labels as a short list and wait for the user. These are confirmations, not errors.

- Continue only after `Watch it` or `Yes, watch everything`.
- On `Cancel`, stop before the full download and say: `No problem — I haven't downloaded the full video.`
- A confirmation applies only to that video in the current request. Ask again for another long video.

### Partial-video placeholder

If the user chooses `Analyse part of it instead`, do not process the whole video. Say:

> Partial-video analysis is coming soon. These are the formats it will support:
>
> `$watch <url> first 20 minutes`
>
> `$watch <url> from 18:00 to 32:00`
>
> For now, I can watch the whole video or cancel.

If a user invokes either placeholder command before that feature is implemented, explain that the shortcut is not available yet. Offer whole-video analysis or cancellation; never silently analyse the whole video.

## Process each approved video

Create a separate temporary directory outside the user's project. Keep downloaded media, frames, audio, captions, and metadata there.

### 1. Obtain the media

For a public URL, run from the temporary directory:

```bash
yt-dlp -f "bv*[height<=720]+ba/b[height<=720]/b" \
  --no-playlist \
  -o "video.%(ext)s" \
  --print-to-file "%(title)s | %(duration)s s | %(uploader)s | %(webpage_url)s" \
  meta.txt '<URL>'
```

Quote the literal URL safely. If a public download fails, report the reason plainly and ask the user to share the video file. Access browser cookies only after separate, contemporaneous permission; explain that this uses their logged-in browser session and may trigger a system prompt.

For a local file, resolve one explicit pathname before continuing. Never pass an unresolved broad glob to an output-producing or destructive command.

### 2. Select representative frames

Read the duration:

```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 '<video-path>'
```

Calculate `interval = max(2, round(duration / 30))` seconds to target roughly 25–35 frames. Use more frames around moments highlighted by the transcript or visible scene changes.

### 3. Extract frames and audio

```bash
mkdir -p frames
ffmpeg -y -loglevel error -i '<video-path>' \
  -vf "fps=1/<interval>,scale=640:-1" frames/frame_%03d.jpg
ffmpeg -y -loglevel error -i '<video-path>' -ar 16000 -ac 1 audio.wav
```

### 4. Obtain a transcript

Prefer reliable supplied captions for longer videos. For a public URL:

```bash
yt-dlp --no-playlist --skip-download --write-subs --write-auto-subs \
  --sub-format vtt --convert-subs srt -o subs '<URL>'
```

If captions are unavailable, discover the model from `WHISPER_MODEL_PATH` or the standard cache checked by `scripts/watch_setup.py`, then run:

```bash
whisper-cli -m '<model-path>' -f audio.wav -np -otxt -of transcript
```

If the language cannot be transcribed reliably, say so rather than presenting guessed text as accurate.

### 5. Inspect the evidence

- Inspect every frame when there are 35 or fewer.
- For larger sets, inspect a chronological sample plus frames around notable transcript moments.
- Cross-reference frame timing with the transcript.
- Separate visible content, spoken claims, on-screen text, and interpretation.
- Do not infer details that are not visible or audible.

## Report clearly

Lead with what the video is and its central idea. Then provide:

- a concise summary;
- notable visual or spoken moments with approximate timestamps;
- the useful idea or technique;
- what appears to be evidence, opinion, demonstration, or marketing;
- practical implications and what would need testing before acting;
- uncertainty caused by missing frames, inaccessible media, or unclear audio.

Optimise for accuracy and usefulness, not excitement. Distinguish a plausible possibility from something the video actually proves.

## Handle files responsibly

Keep working media in the temporary directory for the task. Do not add downloaded videos to a repository, upload them elsewhere, or reproduce substantial copyrighted material in the response. Remove temporary files when they are no longer needed or tell the user where they remain.
