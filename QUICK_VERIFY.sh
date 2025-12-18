#!/bin/bash

# Quick Verification Script for Custody Calendar
# Verifies database schema, seed data, and tests

echo "========================================="
echo "Custody Calendar Quick Verification"
echo "Roberts v. Gardenhire (FPT-25-378556)"
echo "========================================="
echo ""

# Check if PostgreSQL is running
echo "1. Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "   ✓ PostgreSQL client found"
else
    echo "   ✗ PostgreSQL client not found"
    exit 1
fi

# Check if database exists
echo ""
echo "2. Checking database..."
if psql -lqt | cut -d \| -f 1 | grep -qw custody_calendar; then
    echo "   ✓ Database 'custody_calendar' exists"
else
    echo "   ℹ Database 'custody_calendar' not found"
    echo "   Run: createdb custody_calendar"
fi

# Check Node modules
echo ""
echo "3. Checking Node modules..."
if [ -d "node_modules" ]; then
    echo "   ✓ Node modules installed"
else
    echo "   ℹ Node modules not found"
    echo "   Run: npm install"
fi

# Check key files
echo ""
echo "4. Checking implementation files..."
FILES=(
    "database/schema.sql"
    "database/seeds/001_roberts_gardenhire.sql"
    "src/types/database.ts"
    "src/lib/ruleExtractor.ts"
    "src/lib/validationEngine.ts"
    "src/lib/__tests__/validationEngine.test.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file")
        echo "   ✓ $file ($lines lines)"
    else
        echo "   ✗ $file (missing)"
    fi
done

# Run tests
echo ""
echo "5. Running tests..."
npm test -- --testPathPatterns=validationEngine --silent 2>&1 | tail -5

echo ""
echo "========================================="
echo "Verification Complete"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Create database: createdb custody_calendar"
echo "2. Run schema: psql custody_calendar < database/schema.sql"
echo "3. Seed data: psql custody_calendar < database/seeds/001_roberts_gardenhire.sql"
echo "4. Run tests: npm test -- --testPathPatterns=validationEngine"
echo ""
