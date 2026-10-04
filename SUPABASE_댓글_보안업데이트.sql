-- 이미 comments 테이블을 만든 경우 이 파일만 실행해도 됩니다.
-- 익명 사용자는 공개 칼럼 댓글 읽기/작성만 가능하고 수정·삭제 권한은 없습니다.

alter table public.comments enable row level security;

drop policy if exists "public_read_visible_comments" on public.comments;
drop policy if exists "public_insert_comments" on public.comments;

create policy "public_read_visible_comments"
on public.comments
for select
to anon, authenticated
using (is_visible = true);

create policy "public_insert_comments"
on public.comments
for insert
to anon, authenticated
with check (
  is_visible = true
  and (page_path like '/columns/%' or page_path like '/columns/%')
  and char_length(btrim(name)) between 1 and 30
  and char_length(btrim(content)) between 2 and 1000
  and char_length(page_path) between 1 and 300
  and char_length(page_title) <= 200
);

revoke all on table public.comments from anon, authenticated;
grant select on table public.comments to anon, authenticated;
grant insert (page_path, page_title, name, content) on table public.comments to anon, authenticated;
grant usage, select on sequence public.comments_id_seq to anon, authenticated;
