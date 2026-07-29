#!/usr/bin/env python3
"""Check a video's duration before Watch AI downloads or processes it."""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path


def classify_duration(duration: float | None) -> str:
    if duration is None or duration < 0:
        return "unknown"
    if duration > 3600:
        return "very_long"
    if duration > 1200:
        return "long"
    return "normal"


def parse_duration(value: str) -> float | None:
    try:
        duration = float(value.strip().splitlines()[0])
    except (ValueError, IndexError):
        return None
    return duration if duration >= 0 else None


def command_duration(command: list[str]) -> float | None:
    try:
        result = subprocess.run(
            command,
            check=False,
            capture_output=True,
            text=True,
            timeout=90,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return None
    if result.returncode != 0:
        return None
    return parse_duration(result.stdout)


def main() -> int:
    parser = argparse.ArgumentParser()
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--duration", type=float)
    source.add_argument("--url")
    source.add_argument("--file", type=Path)
    args = parser.parse_args()

    if args.duration is not None:
        duration = args.duration
    elif args.url:
        duration = command_duration(
            ["yt-dlp", "--no-playlist", "--skip-download", "--no-warnings", "--print", "%(duration)s", args.url]
        )
    else:
        duration = command_duration(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "csv=p=0",
                str(args.file.resolve()),
            ]
        )

    print(json.dumps({"durationSeconds": duration, "state": classify_duration(duration)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
