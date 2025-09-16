import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://kegdhelzdksivfekktkx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlZ2RoZWx6ZGtzaXZmZWtrdGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNTA1NDgsImV4cCI6MjA3MjgyNjU0OH0.9srURxR_AsLu5lqwodeFuV-zsmkkr82PRh9RSToqQUU';

const supabase = createClient(supabaseUrl, supabaseKey);

// Postgres pool configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:YOUR_PASSWORD@ep-rough-king-a5q8q8q8.us-east-2.aws.neon.tech/neondb?sslmode=require',
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigration() {
    try {
        console.log('🚀 Starting database migration...');

        const client = await pool.connect();

        try {
            // Check if slug column exists
            const checkColumnQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'packages' AND column_name = 'slug'
      `;

            const columnResult = await client.query(checkColumnQuery);

            if (columnResult.rows.length === 0) {
                console.log('📝 Adding slug column...');

                // Add slug column
                await client.query('ALTER TABLE packages ADD COLUMN slug VARCHAR(50)');
                console.log('✅ Slug column added');

                // Update existing records with slug values
                console.log('📝 Updating existing records...');
                await client.query("UPDATE packages SET slug = 'economic' WHERE package_type = 'economic'");
                await client.query("UPDATE packages SET slug = 'comfort' WHERE package_type = 'comfort'");
                await client.query("UPDATE packages SET slug = 'lux' WHERE package_type = 'lux'");
                console.log('✅ Records updated with slug values');

                // Add unique constraint on slug
                console.log('📝 Adding unique constraint...');
                await client.query('ALTER TABLE packages ADD CONSTRAINT packages_slug_unique UNIQUE (slug)');
                console.log('✅ Unique constraint added');

                // Add NOT NULL constraint on slug
                console.log('📝 Adding NOT NULL constraint...');
                await client.query('ALTER TABLE packages ALTER COLUMN slug SET NOT NULL');
                console.log('✅ NOT NULL constraint added');

            } else {
                console.log('ℹ️ Slug column already exists, skipping migration');
            }

            // Verify the migration
            console.log('🔍 Verifying migration...');
            const verifyQuery = 'SELECT package_type, slug, title FROM packages ORDER BY id';
            const verifyResult = await client.query(verifyQuery);

            console.log('📊 Current packages:');
            verifyResult.rows.forEach(row => {
                console.log(`  - ${row.package_type} (slug: ${row.slug}) - ${row.title}`);
            });

            console.log('🎉 Migration completed successfully!');

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
