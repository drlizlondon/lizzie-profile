#!/usr/bin/env python3
"""Report whether Watch AI's local requirements are ready."""

from __future__ import annotations

import json
import os
import shutil
from pathlib import Path


COMMANDS = ("yt-dlp", "ffmpeg", "ffprobe", "whisper-cli")


def model_candidates() -> list[Path]:
    configured = os.environ.get("WHISPER_MODEL_PATH", "").strip()
    candidates = []
    if configured:
        candidates.append(Path(configured).expanduser())
    cache = Path.home() / ".cache" / "whisper-cpp"
    candidates.extend((cache / "ggml-base.bin", cache / "ggml-base.en.bin"))
    return candidates


def main() -> int:
    commands = {name: shutil.which(name) for name in COMMANDS}
    model = next((path for path in model_candidates() if path.is_file() and path.stat().st_size > 0), None)
    missing = [name for name, path in commands.items() if path is None]
    if model is None:
        missing.append("language-model")

    result = {
        "ready": not missing,
        "missing": missing,
        "commands": commands,
        "model": str(model) if model else None,
    }
    print(json.dumps(result, indent=2))
    return 0 if result["ready"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
