-- DSR 위키 전용 Supabase 프로젝트에서 한 번 실행하세요. (Dashboard → SQL Editor에 붙여넣고 Run)
-- 메인 페이지 쿠폰 목록. 관리자가 위키 페이지에서 직접 등록/수정/삭제합니다.
-- 읽기: 위키가 anon 키로 직접 조회(공개 select 정책)
-- 쓰기: 위키의 Netlify 함수(service role)만 수행 — anon/authenticated 쓰기 정책은 두지 않습니다.
begin;

create table if not exists public.site_coupons (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  code text not null check (char_length(code) between 1 and 40),
  ends_at timestamptz, -- null = 기한 미정
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  version integer not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_coupons_ends_at_idx on public.site_coupons (ends_at);

alter table public.site_coupons enable row level security;

drop policy if exists "site_coupons public read" on public.site_coupons;
create policy "site_coupons public read" on public.site_coupons
  for select to anon, authenticated using (true);

revoke insert, update, delete on public.site_coupons from anon, authenticated;
grant select on public.site_coupons to anon, authenticated;

-- 기존 coupon.json 중 아직 유효한 쿠폰 (테이블이 비어 있을 때만)
insert into public.site_coupons (name, code, ends_at, items)
select v.name, v.code, v.ends_at::timestamptz, v.items
from (values
  ('09/11 공용 쿠폰', 'YX45YSB6', null, '[{"name":"EVP 데이터 80% 안정기 (7일)","qty":1,"grade":1},{"name":"궁극체 스킬 강화석","qty":5,"grade":4},{"name":"에보류터","qty":1,"grade":1},{"name":"이동속도 30% 증가 (7일)","qty":1,"grade":1},{"name":"배틀속도 증가 (7일)","qty":1,"grade":1},{"name":"배틀 승리 시 100% 회복 (7일)","qty":1,"grade":1},{"name":"퇴각 100% 성공 (7일)","qty":1,"grade":1},{"name":"배틀 승리 시 추가 전투 1회 (7일)","qty":1,"grade":1}]'::jsonb),
  ('[떼굴떼굴] 영상 쿠폰', 'DSR퀸떼굴', '2026-11-05T10:00:00+09:00', '[{"name":"포텐셜 페이지 확장권","qty":1,"grade":1},{"name":"창고 확장권","qty":1,"grade":2},{"name":"인벤토리 확장권","qty":1,"grade":2},{"name":"수치 잠금 방울","qty":1,"grade":3},{"name":"디지몬보관소 확장권","qty":1,"grade":2}]'::jsonb),
  ('[nIL] 영상 쿠폰', 'nIL', '2026-11-05T10:00:00+09:00', '[{"name":"5% 스텟 고정책 랜덤 상자","qty":1,"grade":4},{"name":"디지코어 인터페이스","qty":2,"grade":1},{"name":"수치 각인 의식 상자","qty":1,"grade":2},{"name":"능력치 각인 의식 상자","qty":1,"grade":2}]'::jsonb),
  ('[Mawasmon] 영상 쿠폰', '2026Mawasmon', '2026-11-05T10:00:00+09:00', '[{"name":"유대감 1% 증가 물약","qty":1,"grade":1},{"name":"최하급 스킬 보호석","qty":2,"grade":1},{"name":"디지코어 인터페이스","qty":2,"grade":1},{"name":"인터페이스 재설정 키트","qty":1,"grade":1}]'::jsonb),
  ('[Alovoce] 영상 쿠폰', 'ALONEW', '2026-11-05T10:00:00+09:00', '[{"name":"궁극체 스킬 강화석","qty":1,"grade":4},{"name":"스킬 강화석 변환제","qty":2,"grade":2},{"name":"최하급 스킬 보호석","qty":4,"grade":1},{"name":"완전체 스킬 강화석","qty":2,"grade":3},{"name":"제로유니트 선택 상자","qty":1,"grade":2}]'::jsonb),
  ('[Klonoa] 영상 쿠폰', 'KlonoaDSR', '2026-11-05T10:00:00+09:00', '[{"name":"유대감 1% 증가 물약","qty":1,"grade":1},{"name":"불카누스몬의 축복","qty":1,"grade":3},{"name":"능력치 각인 의식 상자","qty":1,"grade":2}]'::jsonb),
  ('[hasan] 영상 쿠폰', 'Has4nDSR', '2026-11-05T10:00:00+09:00', '[{"name":"디지몬 보관소 카드 키(30일)","qty":1,"grade":3},{"name":"불카누스몬의 축복","qty":2,"grade":3},{"name":"디지코어 인터페이스","qty":4,"grade":1},{"name":"수치 각인 의식 상자","qty":1,"grade":2}]'::jsonb),
  ('[더미월드] 영상 쿠폰', '낭만의럼블더미', '2026-11-05T10:00:00+09:00', '[{"name":"홀리 링","qty":1,"grade":2},{"name":"마법의 구슬","qty":1,"grade":3},{"name":"디지코어 인터페이스","qty":1,"grade":1},{"name":"능력치 잠금 방울","qty":1,"grade":3},{"name":"디지몬보관소 확장권","qty":1,"grade":2}]'::jsonb),
  ('[청솔] 영상 쿠폰', '디지디지몬몬청솔', '2026-11-05T10:00:00+09:00', '[{"name":"궁극체 스킬 강화석","qty":1,"grade":4},{"name":"디지바이스 프리셋 확장권","qty":1,"grade":1},{"name":"디지코어 인터페이스","qty":3,"grade":1},{"name":"최하급 스킬 보호석","qty":1,"grade":1}]'::jsonb),
  ('개발 팀 노트 #34', '0LEUN98G', '2026-11-13T23:59:00+09:00', '[{"name":"악의 근원","qty":1,"grade":3},{"name":"단단한 성장기 디지타마1","qty":1,"grade":3},{"name":"세번째 덱 기간 확장권 (15일)","qty":1,"grade":1},{"name":"유대감 1% 증가 물약","qty":3,"grade":1}]'::jsonb)
) as v(name, code, ends_at, items)
where not exists (select 1 from public.site_coupons);

commit;
