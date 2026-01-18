graphile-migrate := "graphile-migrate --config ./gmrc.cjs"

# Start PostgreSQL server
start:
    ./scripts/db/postgres.sh start

# Stop PostgreSQL server
stop:
    ./scripts/db/postgres.sh stop

# Destroy PostgreSQL server (destructive)
destroy:
    ./scripts/db/postgres.sh destroy

# Check PostgreSQL server status
status:
    ./scripts/db/postgres.sh status

# Reset database (destructive)
reset:
    {{ graphile-migrate }} reset --erase

# Run database migrations
migrate:
    {{ graphile-migrate }} migrate

# Apply current.sql migration to local database
watch-current:
    {{ graphile-migrate }} watch

# Apply current.sql migration to local database
apply-current:
    {{ graphile-migrate }} watch --once

# Commit migration to migrations/ directory
commit:
    {{ graphile-migrate }} commit

# Move latest migration back to current.sql
uncommit:
    {{ graphile-migrate }} uncommit

# Update schema.sql with current database snapshot
snapshot-schema:
    ./scripts/db/snapshot-schema.sh

# Regenerate database types from schema
types:
    kanel
