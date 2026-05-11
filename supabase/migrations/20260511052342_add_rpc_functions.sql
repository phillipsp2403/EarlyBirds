-- Atomically increment play_count between two playing partners
create or replace function public.increment_play_count(
  p_member_id uuid,
  p_partner_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.playing_partners
  set play_count = play_count + 1
  where member_id = p_member_id
    and partner_id = p_partner_id;
end;
$$;
