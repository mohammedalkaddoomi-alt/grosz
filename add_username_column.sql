-- Add username column to users table
ALTER TABLE users 
ADD COLUMN username TEXT UNIQUE;

-- Add check constraint for username length
ALTER TABLE users
ADD CONSTRAINT username_length_check CHECK (char_length(username) >= 3);

-- Create a function to check username availability
CREATE OR REPLACE FUNCTION check_username_available(username_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM users WHERE username = username_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
