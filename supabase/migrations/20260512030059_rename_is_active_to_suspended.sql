-- Rename is_active to suspended and reverse the logic.
-- Previously: is_active = true means member CAN log in.
-- Now: suspended = true means member CANNOT log in.

alter table public.members rename column is_active to suspended;
alter table public.members alter column suspended set default false;

-- Flip existing values so semantics are preserved
update public.members set suspended = not suspended;
