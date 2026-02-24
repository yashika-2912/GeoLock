-- Create storage bucket for encrypted documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-9u0cqizefu2p_documents',
  'app-9u0cqizefu2p_documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage policies
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'app-9u0cqizefu2p_documents');

CREATE POLICY "Owners can read their documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'app-9u0cqizefu2p_documents');

CREATE POLICY "Owners can update their documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'app-9u0cqizefu2p_documents');

CREATE POLICY "Owners can delete their documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'app-9u0cqizefu2p_documents');