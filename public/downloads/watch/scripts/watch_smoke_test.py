#!/usr/bin/env python3
"""Run a harmless local end-to-end check of Watch AI's media workflow."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path


def run(command: list[str], timeout: int = 120) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, check=True, capture_output=True, text=True, timeout=timeout)


def find_model() -> Path | None:
    configured = os.environ.get("WHISPER_MODEL_PATH", "").strip()
    candidates = [Path(configured).expanduser()] if configured else []
    cache = Path.home() / ".cache" / "whisper-cpp"
    candidates.extend((cache / "ggml-base.bin", cache / "ggml-base.en.bin"))
    return next((path for path in candidates if path.is_file() and path.stat().st_size > 0), None)


def main() -> int:
    required = ("ffmpeg", "ffprobe", "whisper-cli")
    missing = [name for name in required if shutil.which(name) is None]
    model = find_model()
    if missing or model is None:
        print(json.dumps({"ok": False, "missing": missing + ([] if model else ["language-model"])}))
        return 1

    try:
        with tempfile.TemporaryDirectory(prefix="watch-ai-check-") as directory:
            root = Path(directory)
            video = root / "check.mp4"
            frame = root / "frame.jpg"
            audio = root / "audio.wav"
            transcript = root / "transcript"

            run([
                "ffmpeg", "-y", "-loglevel", "error",
                "-f", "lavfi", "-i", "testsrc2=size=320x180:rate=12:duration=2",
                "-f", "lavfi", "-i", "sine=frequency=440:duration=2",
                "-c:v", "mpeg4", "-c:a", "aac", "-shortest", str(video),
            ])
            duration = float(run([
                "ffprobe", "-v", "error", "-show_entries", "format=duration",
                "-of", "csv=p=0", str(video),
            ]).stdout.strip())
            run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(video), "-frames:v", "1", str(frame)])
            run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(video), "-ar", "16000", "-ac", "1", str(audio)])
            run(["whisper-cli", "-m", str(model), "-f", str(audio), "-np", "-otxt", "-of", str(transcript)])

            ok = duration > 0 and frame.is_file() and audio.is_file() and (root / "transcript.txt").is_file()
            print(json.dumps({"ok": ok, "durationSeconds": duration}))
            return 0 if ok else 1
    except (OSError, ValueError, subprocess.SubprocessError) as error:
        print(json.dumps({"ok": False, "message": str(error)}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
