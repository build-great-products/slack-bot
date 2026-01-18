#!/usr/bin/env bash
set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Function to format numbers with commas
format_number() {
    printf "%'d" "$1"
}

# Function to get file size in human-readable format
get_file_size() {
    if [[ -f "$1" ]]; then
        ls -lh "$1" | awk '{print $5}'
    else
        echo "0B"
    fi
}

echo -e "${BOLD}${BLUE}📦 PostgreSQL Schema Dump${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Store the output file path
OUTPUT_FILE="migrations/schema.sql"
TEMP_FILE="${OUTPUT_FILE}.tmp"

# Get database name from URL
DB_NAME=$(echo "$DATABASE_URL" | sed -E 's/.*\/([^?]+).*/\1/')
echo -e "${BOLD}Database:${NC} ${GREEN}${DB_NAME}${NC}"

# Store previous file info if it exists
if [[ -f "$OUTPUT_FILE" ]]; then
    OLD_LINES=$(wc -l < "$OUTPUT_FILE")
    OLD_SIZE=$(get_file_size "$OUTPUT_FILE")
    OLD_TABLES=$(grep -c "^CREATE TABLE" "$OUTPUT_FILE" 2>/dev/null || echo "0")
    OLD_FUNCTIONS=$(grep -c "^CREATE FUNCTION" "$OUTPUT_FILE" 2>/dev/null || echo "0")
    OLD_INDEXES=$(grep -c "^CREATE.*INDEX" "$OUTPUT_FILE" 2>/dev/null || echo "0")
    HAS_OLD=true
else
    HAS_OLD=false
fi

echo -e "${BOLD}Output:${NC}   ${OUTPUT_FILE}\n"

# Start timing
START_TIME=$(date +%s)

echo -e "${YELLOW}⏳ Dumping schema...${NC}"

# Run pg_dump from within docker environment to get schema snapshot
docker compose exec postgres pg_dump "$DATABASE_URL" \
  --exclude-schema=graphile_migrate \
  --exclude-schema=graphile_worker \
  --schema-only \
  --no-owner \
  --format=p \
  --encoding=UTF-8 \
  --restrict-key=xxx \
| sed "/^-- Dumped by pg_dump/d" \
| sed "/^-- Dumped from database version/d" \
> "$TEMP_FILE"

# Check if dump was successful
if [[ ! -s "$TEMP_FILE" ]]; then
    echo -e "${RED}❌ Error: Schema dump failed or produced empty file${NC}"
    rm -f "$TEMP_FILE"
    exit 1
fi

# Move temp file to final location
mv "$TEMP_FILE" "$OUTPUT_FILE"

# Calculate elapsed time
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

# Get new file info
NEW_LINES=$(wc -l < "$OUTPUT_FILE")
NEW_SIZE=$(get_file_size "$OUTPUT_FILE")
NEW_TABLES=$(grep -c "^CREATE TABLE" "$OUTPUT_FILE" 2>/dev/null || echo "0")
NEW_FUNCTIONS=$(grep -c "^CREATE FUNCTION" "$OUTPUT_FILE" 2>/dev/null || echo "0")
NEW_INDEXES=$(grep -c "^CREATE.*INDEX" "$OUTPUT_FILE" 2>/dev/null || echo "0")

echo -e "${GREEN}✅ Schema dump completed in ${ELAPSED}s${NC}\n"

# Display statistics
echo -e "${BOLD}📊 Schema Statistics:${NC}"
echo -e "├─ Tables:     $(format_number "$NEW_TABLES")"
echo -e "├─ Functions:  $(format_number "$NEW_FUNCTIONS")"
echo -e "├─ Indexes:    $(format_number "$NEW_INDEXES")"
echo -e "├─ Total lines: $(format_number "$NEW_LINES")"
echo -e "└─ File size:  ${NEW_SIZE}"

# Show changes if there was a previous file
if [[ "$HAS_OLD" == true ]]; then
    echo -e "\n${BOLD}📈 Changes from previous dump:${NC}"

    # Calculate differences
    LINES_DIFF=$((NEW_LINES - OLD_LINES))
    TABLES_DIFF=$((NEW_TABLES - OLD_TABLES))
    FUNCTIONS_DIFF=$((NEW_FUNCTIONS - OLD_FUNCTIONS))
    INDEXES_DIFF=$((NEW_INDEXES - OLD_INDEXES))

    # Function to show diff with color
    show_diff() {
        local diff=$1
        local label=$2
        if [[ $diff -gt 0 ]]; then
            echo -e "├─ ${label}: ${GREEN}+$(format_number "$diff")${NC}"
        elif [[ $diff -lt 0 ]]; then
            echo -e "├─ ${label}: ${RED}$(format_number "$diff")${NC}"
        else
            echo -e "├─ ${label}: ${BLUE}no change${NC}"
        fi
    }

    show_diff "$TABLES_DIFF" "Tables    "
    show_diff "$FUNCTIONS_DIFF" "Functions "
    show_diff "$INDEXES_DIFF" "Indexes   "
    show_diff "$LINES_DIFF" "Lines     "
    echo -e "└─ Size:       ${OLD_SIZE} → ${NEW_SIZE}"

    # Git status if in a git repo
    if git rev-parse --git-dir > /dev/null 2>&1; then
        if git diff --quiet "$OUTPUT_FILE" 2>/dev/null; then
            echo -e "\n${BLUE}ℹ️  No changes detected in schema${NC}"
        else
            echo -e "\n${YELLOW}⚠️  Schema has uncommitted changes${NC}"
            # Show a brief summary of what changed
            ADDED=$(git diff "$OUTPUT_FILE" 2>/dev/null | grep -c "^+" | tail -1)
            REMOVED=$(git diff "$OUTPUT_FILE" 2>/dev/null | grep -c "^-" | tail -1)
            if [[ $ADDED -gt 0 || $REMOVED -gt 0 ]]; then
                echo -e "   ${GREEN}+${ADDED}${NC} additions, ${RED}-${REMOVED}${NC} deletions"
            fi
        fi
    fi
fi

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
