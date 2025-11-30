#!/bin/bash
# Setup script to ensure Node.js 18 is in PATH
export PATH="/opt/homebrew/opt/node@18/bin:$PATH"

# Run the command passed as arguments
"$@"
