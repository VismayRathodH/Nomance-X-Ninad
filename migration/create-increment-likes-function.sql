-- Create function to increment likes count on posts
CREATE OR REPLACE FUNCTION public.increment_likes_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;
