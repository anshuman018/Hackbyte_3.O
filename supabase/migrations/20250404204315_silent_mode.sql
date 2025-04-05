/*
  # Initial Schema for DocCrypts

  1. New Tables
    - institutions
      - id (uuid, primary key)
      - name (text)
      - created_at (timestamp)
    
    - verifiers
      - id (uuid, primary key)
      - email (text)
      - institution_id (uuid, foreign key)
      - created_at (timestamp)
    
    - documents
      - id (uuid, primary key)
      - title (text)
      - file_path (text)
      - hash (text)
      - status (enum)
      - uploaded_by_email (text)
      - institution_id (uuid, foreign key)
      - verifier_id (uuid, foreign key, nullable)
      - comments (text)
      - created_at (timestamp)
      - verified_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for read/write access
*/

-- Create custom types
CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected');

-- Create institutions table
CREATE TABLE IF NOT EXISTS institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create verifiers table
CREATE TABLE IF NOT EXISTS verifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_path text NOT NULL,
  hash text UNIQUE NOT NULL,
  status document_status DEFAULT 'pending',
  uploaded_by_email text NOT NULL,
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  verifier_id uuid REFERENCES verifiers(id),
  comments text,
  created_at timestamptz DEFAULT now(),
  verified_at timestamptz
);

-- Enable RLS
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read access to institutions"
  ON institutions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin full access to institutions"
  ON institutions
  TO authenticated
  USING (true);

CREATE POLICY "Public read access to verifiers"
  ON verifiers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin full access to verifiers"
  ON verifiers
  TO authenticated
  USING (true);

CREATE POLICY "Public read access to approved documents"
  ON documents
  FOR SELECT
  TO public
  USING (status = 'approved');

CREATE POLICY "Users can upload documents"
  ON documents
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Verifiers can update documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM verifiers
      WHERE verifiers.id = documents.verifier_id
    )
  );