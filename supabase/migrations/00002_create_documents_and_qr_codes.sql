-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  encryption_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create QR codes table
CREATE TABLE public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  allowed_latitude DOUBLE PRECISION,
  allowed_longitude DOUBLE PRECISION,
  geo_radius_meters INTEGER DEFAULT 100,
  expires_at TIMESTAMPTZ,
  require_otp BOOLEAN NOT NULL DEFAULT false,
  otp_code TEXT,
  otp_expires_at TIMESTAMPTZ,
  password_hash TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create access logs table
CREATE TABLE public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  access_granted BOOLEAN NOT NULL,
  denial_reason TEXT,
  viewer_latitude DOUBLE PRECISION,
  viewer_longitude DOUBLE PRECISION,
  user_agent TEXT,
  ip_address TEXT,
  ai_alert_generated BOOLEAN DEFAULT false,
  ai_alert_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_qr_codes_document ON qr_codes(document_id);
CREATE INDEX idx_qr_codes_code ON qr_codes(code);
CREATE INDEX idx_access_logs_qr_code ON access_logs(qr_code_id);
CREATE INDEX idx_access_logs_document ON access_logs(document_id);
CREATE INDEX idx_access_logs_created ON access_logs(created_at DESC);

-- Enable realtime for access logs
ALTER PUBLICATION supabase_realtime ADD TABLE access_logs;

-- RLS policies for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all documents" ON documents
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Owners can view their own documents" ON documents
  FOR SELECT TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Owners and admins can insert documents" ON documents
  FOR INSERT TO authenticated 
  WITH CHECK (owner_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Owners can update their own documents" ON documents
  FOR UPDATE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their own documents" ON documents
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- RLS policies for qr_codes
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all qr codes" ON qr_codes
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Owners can view qr codes for their documents" ON qr_codes
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM documents d 
      WHERE d.id = qr_codes.document_id AND d.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view active qr codes by code" ON qr_codes
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "Owners can insert qr codes for their documents" ON qr_codes
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d 
      WHERE d.id = qr_codes.document_id AND d.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update qr codes for their documents" ON qr_codes
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM documents d 
      WHERE d.id = qr_codes.document_id AND d.owner_id = auth.uid()
    )
  );

-- RLS policies for access_logs
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all access logs" ON access_logs
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Owners can view logs for their documents" ON access_logs
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM documents d 
      WHERE d.id = access_logs.document_id AND d.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert access logs" ON access_logs
  FOR INSERT TO anon, authenticated WITH CHECK (true);