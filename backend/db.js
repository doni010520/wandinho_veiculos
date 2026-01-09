import pg from 'pg';
const { Pool } = pg;

// Supabase usa DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;
