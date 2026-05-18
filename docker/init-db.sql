-- ARGUS — Database Initialization
-- Creates extensions and initial schema for PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure schema exists
CREATE SCHEMA IF NOT EXISTS argus;
SET search_path TO argus, public;
