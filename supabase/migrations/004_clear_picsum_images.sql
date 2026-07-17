-- Clear all previously seeded images (they used random Picsum, not topic-relevant).
-- Challenges will auto-reseed with topic-relevant Unsplash images on next user visit.

delete from public.user_image_assignments;
delete from public.challenge_images;
