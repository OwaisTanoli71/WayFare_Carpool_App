-- Supabase Schema for Wayfare Carpool App

-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table extending Supabase Auth
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  gender TEXT,
  age INTEGER,
  city TEXT,
  role TEXT,
  gender_pref TEXT,
  avatar TEXT,
  verified BOOLEAN DEFAULT false,
  verified_plus BOOLEAN DEFAULT false,
  co2_saved NUMERIC DEFAULT 0,
  ride_streak INTEGER DEFAULT 0,
  wallet_balance NUMERIC DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trusted Contacts
CREATE TABLE IF NOT EXISTS public.trusted_contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Rides
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  driver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  type TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  seats INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  gender_pref TEXT,
  car TEXT,
  status TEXT DEFAULT 'open',
  is_recurring BOOLEAN DEFAULT false,
  recurring_days JSONB,
  pin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE,
  rider_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  dropoff_location TEXT,
  fare NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ride Circles
CREATE TABLE IF NOT EXISTS public.ride_circles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, member_id)
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(booking_id, reviewer_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. USERS POLICIES
CREATE POLICY "Admins bypass RLS for users" ON public.users FOR ALL USING ((select role from public.users where id = auth.uid()) = 'admin');

CREATE POLICY "Users can read all profiles" ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Prevent updating protected columns using a trigger
CREATE OR REPLACE FUNCTION public.protect_user_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow service role (auth.uid() is null for service role usually in standard implementations, but let's just check admin role)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Allow admins
  IF (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Revert protected fields to OLD values if a normal user tries to change them
  NEW.role = OLD.role;
  NEW.verified = OLD.verified;
  NEW.verified_plus = OLD.verified_plus;
  NEW.wallet_balance = OLD.wallet_balance;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_user_fields_trigger ON public.users;
CREATE TRIGGER protect_user_fields_trigger
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.protect_user_fields();

-- 2. RIDES POLICIES
CREATE POLICY "Admins bypass RLS for rides" ON public.rides FOR ALL USING ((select role from public.users where id = auth.uid()) = 'admin');
CREATE POLICY "Rides are publicly readable" ON public.rides FOR SELECT USING (true);
CREATE POLICY "Drivers can insert rides" ON public.rides FOR INSERT WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Drivers can update their rides" ON public.rides FOR UPDATE USING (auth.uid() = driver_id);
CREATE POLICY "Drivers can delete their rides" ON public.rides FOR DELETE USING (auth.uid() = driver_id);

-- 3. BOOKINGS POLICIES
CREATE POLICY "Admins bypass RLS for bookings" ON public.bookings FOR ALL USING ((select role from public.users where id = auth.uid()) = 'admin');
CREATE POLICY "Riders and Drivers can read bookings" ON public.bookings FOR SELECT USING (
  auth.uid() = rider_id OR 
  auth.uid() IN (SELECT driver_id FROM public.rides WHERE id = ride_id)
);
CREATE POLICY "Riders can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = rider_id);
CREATE POLICY "Riders and Drivers can update bookings" ON public.bookings FOR UPDATE USING (
  auth.uid() = rider_id OR 
  auth.uid() IN (SELECT driver_id FROM public.rides WHERE id = ride_id)
);

-- 4. MESSAGES POLICIES
CREATE POLICY "Admins bypass RLS for messages" ON public.messages FOR ALL USING ((select role from public.users where id = auth.uid()) = 'admin');
CREATE POLICY "Booking participants can read messages" ON public.messages FOR SELECT USING (
  auth.uid() IN (SELECT rider_id FROM public.bookings WHERE ride_id = messages.ride_id) OR
  auth.uid() IN (SELECT driver_id FROM public.rides WHERE id = messages.ride_id)
);
CREATE POLICY "Booking participants can insert messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND (
    auth.uid() IN (SELECT rider_id FROM public.bookings WHERE ride_id = messages.ride_id) OR
    auth.uid() IN (SELECT driver_id FROM public.rides WHERE id = messages.ride_id)
  )
);

-- 5. TRUSTED CONTACTS & RIDE CIRCLES
CREATE POLICY "Admins bypass RLS for trusted_contacts" ON public.trusted_contacts FOR ALL USING ((select role from public.users where id = auth.uid()) = 'admin');
CREATE POLICY "Users manage their own trusted contacts" ON public.trusted_contacts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins bypass RLS for ride_circles" ON public.ride_circles FOR ALL USING ((select role from public.users where id = auth.uid()) = 'admin');
CREATE POLICY "Users manage their own ride circles" ON public.ride_circles FOR ALL USING (auth.uid() = user_id);

-- 6. REVIEWS POLICIES
CREATE POLICY "Admins bypass RLS for reviews" ON public.reviews FOR ALL USING ((select role from public.users where id = auth.uid()) = 'admin');
CREATE POLICY "Reviews are publicly readable" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Participants can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- 7. NOTIFICATIONS POLICIES
CREATE POLICY "Admins bypass RLS for notifications" ON public.notifications FOR ALL USING ((select role from public.users where id = auth.uid()) = 'admin');
CREATE POLICY "Users read and update their own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- 8. REPUTATION RPC
CREATE OR REPLACE FUNCTION public.get_user_reputation(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  avg_rating NUMERIC;
  top_tags JSON;
BEGIN
  -- Calculate average rating
  SELECT ROUND(AVG(rating), 1) INTO avg_rating
  FROM public.reviews
  WHERE reviewee_id = target_user_id;

  -- Get top 3 tags by frequency
  SELECT json_agg(tag_name) INTO top_tags
  FROM (
    SELECT tag_name, count(*) as freq
    FROM public.reviews, jsonb_array_elements_text(tags) as tag_name
    WHERE reviewee_id = target_user_id
    GROUP BY tag_name
    ORDER BY freq DESC
    LIMIT 3
  ) sub;

  RETURN json_build_object('rating', COALESCE(avg_rating, 0), 'tags', COALESCE(top_tags, '[]'::json));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_driver_stats(driver_uuid UUID)
RETURNS JSON AS $$
DECLARE
  reputation JSON;
  completed_count INTEGER;
BEGIN
  -- Get reputation using the other function
  SELECT public.get_user_reputation(driver_uuid) INTO reputation;

  -- Count completed bookings where this user was the driver
  SELECT count(*) INTO completed_count
  FROM public.bookings b
  JOIN public.rides r ON b.ride_id = r.id
  WHERE r.driver_id = driver_uuid AND b.status = 'completed';

  RETURN json_build_object(
    'rating', reputation->'rating',
    'tags', reputation->'tags',
    'completed_rides', completed_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. NOTIFICATION TRIGGERS
CREATE OR REPLACE FUNCTION public.trigger_booking_notification()
RETURNS TRIGGER AS $$
DECLARE
  ride_driver_id UUID;
  rider_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get driver id and rider name
    SELECT driver_id INTO ride_driver_id FROM public.rides WHERE id = NEW.ride_id;
    SELECT name INTO rider_name FROM public.users WHERE id = NEW.rider_id;
    
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (ride_driver_id, 'booking_request', 'New Booking Request', rider_name || ' requested a seat on your ride.', '/ride/' || NEW.ride_id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status != OLD.status THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.rider_id, 'booking_update', 'Booking Update', 'Your booking status is now: ' || NEW.status, '/ride/' || NEW.ride_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS booking_notification_trigger ON public.bookings;
CREATE TRIGGER booking_notification_trigger
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.trigger_booking_notification();

CREATE OR REPLACE FUNCTION public.trigger_review_notification()
RETURNS TRIGGER AS $$
DECLARE
  reviewer_name TEXT;
BEGIN
  SELECT name INTO reviewer_name FROM public.users WHERE id = NEW.reviewer_id;
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (NEW.reviewee_id, 'review_received', 'New Review', reviewer_name || ' left you a review.', '/profile');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS review_notification_trigger ON public.reviews;
CREATE TRIGGER review_notification_trigger
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.trigger_review_notification();

-- 10. APP REVIEWS (TESTIMONIALS)
CREATE TABLE IF NOT EXISTS public.app_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.app_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins bypass RLS for app_reviews" ON public.app_reviews FOR ALL USING ((select role from public.users where id = auth.uid()) = 'admin');
CREATE POLICY "App reviews are publicly readable if approved" ON public.app_reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can insert their own app review" ON public.app_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
