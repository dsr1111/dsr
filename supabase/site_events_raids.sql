-- DSR 위키 전용 Supabase 프로젝트에서 한 번 실행하세요. (Dashboard → SQL Editor에 붙여넣고 Run)
-- site_coupons.sql 다음에 실행합니다. 이벤트 캘린더와 레이드 타이머를 위키 페이지에서 수정할 수 있게 합니다.
-- 읽기: 위키가 공개 키로 직접 조회 / 쓰기: 위키의 Netlify 함수(secret 키)만 수행
begin;

-- ===== 이벤트 캘린더 =====
create table if not exists public.site_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  starts_at timestamptz not null,
  ends_at timestamptz,
  background_color text check (background_color ~ '^#[0-9a-fA-F]{6}$'),
  text_color text check (text_color ~ '^#[0-9a-fA-F]{6}$'),
  version integer not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create index if not exists site_events_ends_at_idx on public.site_events (ends_at);

-- ===== 레이드 타이머 =====
-- schedule 예시
--   매일:          {"type":"daily","times":["19:30"]}
--   매주 요일:     {"type":"weekly","times":["22:00"],"days":[2]}        (0=일 ~ 6=토)
--   2주마다:       {"type":"biweekly","times":["23:00"],"baseDate":"2025-05-31"}
--   요일별 시간:   {"type":"custom_weekly","schedules":[{"day":5,"time":"21:00"}]}
--   순환:          {"type":"rotation","baseTime":"19:00","baseDate":"2026-10-22","stepMinutes":25}
create table if not exists public.site_raids (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  image_name text check (image_name is null or char_length(image_name) between 1 and 60),
  map text not null default '' check (char_length(map) <= 40),
  map_image text check (map_image is null or char_length(map_image) between 1 and 60),
  schedule jsonb not null check (jsonb_typeof(schedule) = 'object'),
  active_from timestamptz,
  active_until timestamptz,
  version integer not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===== 권한: 누구나 읽기만 =====
alter table public.site_events enable row level security;
alter table public.site_raids enable row level security;

drop policy if exists "site_events public read" on public.site_events;
create policy "site_events public read" on public.site_events
  for select to anon, authenticated using (true);

drop policy if exists "site_raids public read" on public.site_raids;
create policy "site_raids public read" on public.site_raids
  for select to anon, authenticated using (true);

revoke insert, update, delete on public.site_events, public.site_raids from anon, authenticated;
grant select on public.site_events, public.site_raids to anon, authenticated;

-- ===== 현재 데이터 옮기기 (테이블이 비어 있을 때만) =====
insert into public.site_events (title, starts_at, ends_at, background_color, text_color)
select v.title, v.starts_at::timestamptz, v.ends_at::timestamptz, v.bg, v.fg
from (values
  ('해골이 최고야', '2026-10-22T15:00:00+09:00', '2026-11-05T10:00:00+09:00', '#a66bff', '#ffffff'),
  ('고스몬의 오싹한 유령의 집', '2026-10-22T15:00:00+09:00', '2026-11-19T10:00:00+09:00', '#3788d8', '#ffffff')
) as v(title, starts_at, ends_at, bg, fg)
where not exists (select 1 from public.site_events);

insert into public.site_raids (name, map, map_image, schedule, active_from, active_until)
select v.name, v.map, v.map_image, v.schedule::jsonb, v.active_from::timestamptz, v.active_until::timestamptz
from (values
  ('펌프몬', '시부야', '1930', '{"type":"daily","times":["19:30"]}', null, null),
  ('울퉁몬', '시부야', '2130', '{"type":"daily","times":["21:30"]}', null, null),
  ('블랙세라피몬', '???', 'weekend', '{"type":"biweekly","times":["23:00"],"baseDate":"2025-05-31"}', null, null),
  ('오파니몬:폴다운모드', '???', 'weekend', '{"type":"biweekly","times":["23:00"],"baseDate":"2025-06-07"}', null, null),
  ('메기드라몬', '???', 'weekend', '{"type":"biweekly","times":["22:00"],"baseDate":"2025-06-08"}', null, null),
  ('오메가몬', '어둠성 계곡', 'omega', '{"type":"biweekly","times":["22:00"],"baseDate":"2025-06-01"}', null, null),
  ('주작몬', '기어 사바나', '주작몬', '{"type":"weekly","times":["22:00"],"days":[2]}', null, null),
  ('현무몬', '용의 눈 호수', '현무몬', '{"type":"weekly","times":["22:00"],"days":[3]}', null, null),
  ('청룡몬', '어둠성 계곡', '청룡몬', '{"type":"weekly","times":["22:00"],"days":[4]}', null, null),
  ('백호몬', '사막 지대', '백호몬', '{"type":"weekly","times":["22:00"],"days":[5]}', null, null),
  ('엑자몬', '어둠성 계곡', '엑자몬', '{"type":"biweekly","times":["00:30"],"baseDate":"2026-04-26"}', null, null),
  ('알파몬', '오다이바 입구', null, '{"type":"custom_weekly","schedules":[{"day":5,"time":"21:00"},{"day":6,"time":"09:00"},{"day":6,"time":"21:00"},{"day":0,"time":"09:00"},{"day":0,"time":"21:00"},{"day":1,"time":"09:00"}]}', '2026-09-10T15:00:00+09:00', '2026-10-08T10:00:00+09:00'),
  ('왕개굴몬', '어둠성 계곡', null, '{"type":"rotation","baseTime":"19:00","baseDate":"2026-10-22","stepMinutes":25}', null, null)
) as v(name, map, map_image, schedule, active_from, active_until)
where not exists (select 1 from public.site_raids);

commit;
