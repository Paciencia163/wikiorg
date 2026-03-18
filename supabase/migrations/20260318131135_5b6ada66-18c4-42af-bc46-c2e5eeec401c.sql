CREATE POLICY "Admins and creators can delete collaborators"
ON public.book_collaborators
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM books WHERE books.id = book_collaborators.book_id AND books.created_by = auth.uid()
  )
);