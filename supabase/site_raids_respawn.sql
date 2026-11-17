-- 레이드 개편: 고정형 / 처치주기형 구분 (2026-11)
-- 고정형: 블랙세라피몬, 오파니몬:폴다운모드, 메기드라몬, 오메가몬, 주작몬, 현무몬, 청룡몬, 백호몬, 엑자몬
-- 나머지는 처치주기형 (위키에 "인게임 타이머 확인"으로 표시, 알림 없음)

begin;

-- 주작몬: 매주 화요일 22:00 → 08:00
update public.site_raids
   set schedule = '{"type":"weekly","days":[2],"times":["08:00"]}'::jsonb,
       version = version + 1, updated_at = now()
 where name = '주작몬';

-- 처치주기형으로 변경
update public.site_raids
   set schedule = '{"type":"respawn"}'::jsonb,
       version = version + 1, updated_at = now()
 where name in ('펌프몬', '울퉁몬', '황금무사몬');

commit;

-- 확인용
select name, schedule from public.site_raids order by created_at;
