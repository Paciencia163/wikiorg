
-- Replace the overly permissive INSERT policy with a restrictive one
DROP POLICY "System can insert notifications" ON public.notifications;
-- Only the trigger (SECURITY DEFINER) inserts; no direct user inserts needed
CREATE POLICY "No direct inserts" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (false);
