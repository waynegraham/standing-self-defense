#!/bin/bash

DIRECTORY="src/static"
PROCESS_ALL=false

# Parse command-line arguments
while [[ "$#" -gt 0 ]]; do
    case "$1" in
        --all)
            PROCESS_ALL=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Ensure directory exists
if [[ ! -d "$DIRECTORY" ]]; then
    echo "Directory '$DIRECTORY' does not exist."
    exit 1
fi

# Process images
for jpg_file in "$DIRECTORY"/*.jpg; do
    [[ -e "$jpg_file" ]] || continue  # Skip if no jpg files exist
    webp_file="${jpg_file%.jpg}.webp"
    
    if [[ "$PROCESS_ALL" = false && -f "$webp_file" ]]; then
        continue  # Skip if webp version already exists
    fi
    
    echo "Converting: $(basename "$jpg_file") -> $(basename "$webp_file")"
    cwebp -q 80 "$jpg_file" -o "$webp_file"
done

echo "Processing complete."