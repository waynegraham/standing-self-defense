#!/usr/bin/env zsh
# Resize images larger than 2560x1400 using ImageMagick (macOS-friendly).
# Re-execs under zsh if invoked with bash or sh.

# If we're in bash, restart under zsh.
[ -n "$BASH_VERSION" ] && exec zsh "$0" "$@"

# Strict mode (zsh syntax)
set -e
set -u
set -o pipefail

# Safer IFS for filenames with spaces
IFS=$'\n\t'

# Include common Homebrew paths
export PATH="/opt/homebrew/bin:/usr/local/bin:${PATH}"

IMAGE_DIR="src/static"
MAX_WIDTH=2560
MAX_HEIGHT=1400

# Ensure directory exists
if [[ ! -d "$IMAGE_DIR" ]]; then
  print -u2 "Error: directory not found: $IMAGE_DIR"
  exit 1
fi

# Check ImageMagick availability
if ! command -v identify >/dev/null 2>&1 || ! command -v mogrify >/dev/null 2>&1; then
  print -u2 "Error: ImageMagick not found. Install with:"
  print -u2 "  brew install imagemagick"
  exit 1
fi

# Find images case-insensitively without relying on shell glob options
# -print0 handles spaces/newlines safely
found_any=0
autoload -Uz is-at-least 2>/dev/null || true

while IFS= read -r -d '' image; do
  found_any=1

  # Get width and height
  dim_output=$(identify -ping -format "%w %h" -- "$image" 2>/dev/null || true)
  if [[ -z "$dim_output" ]]; then
    print "Skipping unreadable or unsupported file: $image"
    continue
  fi

  width=${dim_output%% *}
  height=${dim_output##* }

  # Numeric sanity
  if ! [[ "$width" =~ '^[0-9]+$' && "$height" =~ '^[0-9]+$' ]]; then
    print "Skipping file with unexpected dimensions output: $image -> '$dim_output'"
    continue
  fi

  if (( width > MAX_WIDTH || height > MAX_HEIGHT )); then
    print "Resizing: $image (${width}x${height}) -> fit within ${MAX_WIDTH}x${MAX_HEIGHT}"
    mogrify -auto-orient -resize "${MAX_WIDTH}x${MAX_HEIGHT}>" -- "$image"
  else
    print "Skipping: $image (${width}x${height}) within limits"
  fi
done < <(find "$IMAGE_DIR" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -print0)

if (( found_any == 0 )); then
  print "No images found in $IMAGE_DIR matching jpg/jpeg/png."
fi