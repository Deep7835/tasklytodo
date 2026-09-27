import { useEffect } from 'react';
import { ArrowLeft, ArrowRight, Clock, Lamp } from 'reicon-react';
import { Logo } from '../components/Nav';
import { loadPrefs } from '../store/storage';
import { POSTS, readMinutes, type Block, type Post } from './posts';

const formatDate = (key: string) =>
  new Date(`${key}T00:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

function setMeta(title: string, description: string) {
  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
}

/** Routes `/blog` (index) and `/blog/<slug>` (article). Links are plain anchors; each opens as its own page. */
export function Blog({ path }: { path: string }) {
  // Theme class is applied before paint by index.html; the accent lives in prefs.
  useEffect(() => {
    document.documentElement.dataset.accent = loadPrefs().accent;
  }, []);

  const slug = path.replace(/^\/blog\/?/, '').replace(/\/$/, '');
  const post = slug ? POSTS.find((p) => p.slug === slug) : undefined;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/80 pt-safe backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-14 max-w-[760px] items-center gap-3 px-4 sm:px-6">
          <a href="/blog" className="flex items-center gap-2.5">
            <Logo className="size-6" />
            <span className="text-[16px] font-medium tracking-[-0.02em]">Taskly</span>
            <span className="text-[16px] text-muted">Blog</span>
          </a>
          <a href="/" className="btn-primary ml-auto inline-flex h-9 items-center gap-1.5 rounded-[12px] px-3.5 text-[13px] font-medium">
            Open app
            <ArrowRight className="size-4" />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-[760px] px-4 pt-8 pb-24 sm:px-6 md:pt-12">
        {slug ? post ? <Article post={post} /> : <NotFound /> : <Index />}
      </main>
    </div>
  );
}

function Index() {
  useEffect(() => setMeta('Blog · Taskly', 'Practical ideas for planning your day and finishing what matters.'), []);
  return (
    <div className="animate-fade-in">
      <p className="text-[12px] font-medium tracking-[0.06em] text-muted uppercase">Taskly Blog</p>
      <h1 className="mt-1.5 text-[32px] leading-tight font-medium tracking-[-0.025em]">Plan less. Finish more.</h1>
      <p className="mt-2 max-w-[34rem] text-[15px] leading-relaxed text-muted">Practical ideas for planning your day and finishing what matters.</p>

      <ul className="mt-8 flex flex-col gap-4">
        {POSTS.map((p) => (
          <li key={p.slug}>
            <a
              href={`/blog/${p.slug}`}
              className="card-surface group block rounded-[20px] p-5 transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-float"
            >
              <PostMeta post={p} />
              <h2 className="mt-2.5 text-[20px] leading-snug font-medium tracking-[-0.015em]">{p.title}</h2>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{p.description}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-accent">
                Read article
                <ArrowRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PostMeta({ post }: { post: Post }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-muted">
      <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">{post.tag}</span>
      <span>{formatDate(post.date)}</span>
      <span className="text-faint">·</span>
      <span className="inline-flex items-center gap-1">
        <Clock className="size-3.5" />
        {readMinutes(post)} min read
      </span>
    </p>
  );
}

function Article({ post }: { post: Post }) {
  useEffect(() => setMeta(`${post.title} · Taskly Blog`, post.description), [post]);
  return (
    <article className="animate-fade-in">
      <a href="/blog" className="-ml-2 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-muted transition-colors hover:bg-hover hover:text-fg">
        <ArrowLeft className="size-4" />
        All articles
      </a>
      <div className="mt-5">
        <PostMeta post={post} />
      </div>
      <h1 className="mt-3 text-[30px] leading-[1.15] font-medium tracking-[-0.025em] md:text-[38px]">{post.title}</h1>
      <p className="mt-3 text-[17px] leading-relaxed text-muted">{post.description}</p>

      <div className="mt-8 border-t border-line pt-8">
        {post.body.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}
      </div>

      <aside className="card-surface mt-10 flex flex-col items-start gap-4 rounded-[20px] p-5 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="text-[16px] font-medium tracking-[-0.01em]">Try it in Taskly</p>
          <p className="mt-1 text-[14px] leading-relaxed text-muted">Fast, offline and private. Open it, type a task, press Enter.</p>
        </div>
        <a href="/" className="btn-primary inline-flex h-10 items-center gap-1.5 rounded-[12px] px-4 text-[13.5px] font-medium">
          Open Taskly
          <ArrowRight className="size-4" />
        </a>
      </aside>
    </article>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'h2':
      return <h2 className="mt-10 mb-3 text-[22px] leading-snug font-medium tracking-[-0.015em] first:mt-0">{block.text}</h2>;
    case 'p':
      return <p className="mb-5 text-[16.5px] leading-[1.75] text-fg/85">{block.text}</p>;
    case 'ul':
    case 'ol': {
      const List = block.type;
      return (
        <List className={`mb-5 flex flex-col gap-2 pl-6 text-[16.5px] leading-[1.7] text-fg/85 ${block.type === 'ul' ? 'list-disc' : 'list-decimal'} marker:text-accent`}>
          {block.items.map((item) => (
            <li key={item} className="pl-1">
              {item}
            </li>
          ))}
        </List>
      );
    }
    case 'tip':
      return (
        <p className="mb-6 flex gap-3 rounded-2xl border border-line bg-accent-soft/60 px-4 py-3.5 text-[15px] leading-relaxed text-fg/85">
          <Lamp className="mt-0.5 size-5 shrink-0 text-accent" />
          <span>{block.text}</span>
        </p>
      );
  }
}

function NotFound() {
  useEffect(() => setMeta('Article not found · Taskly Blog', 'This article does not exist.'), []);
  return (
    <div className="py-16 text-center">
      <h1 className="text-[24px] font-medium">Article not found</h1>
      <p className="mt-2 text-[15px] text-muted">It may have moved or never existed.</p>
      <a href="/blog" className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-[12px] bg-hover px-4 text-[13.5px] font-medium hover:bg-line">
        <ArrowLeft className="size-4" />
        All articles
      </a>
    </div>
  );
}
