import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock, Copy, Lamp } from 'reicon-react';
import { Logo } from '../components/Nav';
import { cn } from '../lib/ui';
import { loadPrefs } from '../store/storage';
import { POSTS, readMinutes, type Block, type Post } from './posts';

const formatDate = (key: string) =>
  new Date(`${key}T00:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

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
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/80 pt-safe backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-14 w-full max-w-[1080px] items-center gap-3 px-4 sm:px-6">
          <a href="/blog" className="flex items-center gap-2.5">
            <Logo className="size-6" />
            <span className="text-[16px] font-medium tracking-[-0.02em]">Taskdeck</span>
            <span className="rounded-full bg-hover px-2 py-0.5 text-[12px] font-medium text-muted">Blog</span>
          </a>
          <a href="/" className="btn-primary ml-auto inline-flex h-9 items-center gap-1.5 rounded-[12px] px-3.5 text-[13px] font-medium">
            Open app
            <ArrowRight className="size-4" />
          </a>
        </div>
      </header>

      <main className="flex-1">{slug ? post ? <Article post={post} /> : <NotFound /> : <Index />}</main>
      <Footer />
    </div>
  );
}

/** Decorative cover: accent gradient mesh, film grain and a glassy to-do card. */
function CoverArt({ className }: { className?: string }) {
  const rows = [
    { done: true, width: '72%' },
    { done: true, width: '56%' },
    { done: false, width: '80%' },
  ];
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{
        backgroundImage: [
          'radial-gradient(80% 90% at 12% 8%, oklch(from var(--accent) calc(l + 0.14) c calc(h - 30) / 0.9), transparent 60%)',
          'radial-gradient(70% 80% at 92% 95%, oklch(from var(--accent) calc(l - 0.02) c calc(h + 40) / 0.85), transparent 62%)',
          'linear-gradient(135deg, var(--accent), oklch(from var(--accent) calc(l - 0.14) c h))',
        ].join(', '),
      }}
      aria-hidden
    >
      <div className="grain-overlay absolute inset-0" />
      <div className="absolute top-1/2 left-1/2 w-[64%] max-w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white/15 p-4 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.45)] ring-1 ring-white/30 backdrop-blur-md">
        <div className="mb-3 h-2 w-1/3 rounded-full bg-white/80" />
        <div className="flex flex-col gap-2.5">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className={cn('grid size-5 shrink-0 place-items-center rounded-full border-2 border-white/85', r.done && 'bg-white')}>
                {r.done && <Check className="size-3 text-accent" strokeWidth={3} />}
              </span>
              <span className={cn('h-2 rounded-full', r.done ? 'bg-white/55' : 'bg-white/85')} style={{ width: r.width }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PostMeta({ post, className }: { post: Post; className?: string }) {
  return (
    <p className={cn('flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-muted', className)}>
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

function Index() {
  useEffect(() => setMeta('Blog · Taskdeck', 'Practical ideas for planning your day and finishing what matters.'), []);
  const [featured, ...rest] = POSTS;

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(60% 120% at 50% -20%, color-mix(in oklab, var(--accent) 16%, transparent), transparent 70%)' }}
          aria-hidden
        />
        <div className="grain-overlay absolute inset-0 opacity-20" aria-hidden />
        <div className="relative mx-auto max-w-[1080px] px-4 pt-14 pb-12 text-center sm:px-6 md:pt-20 md:pb-16">
          <p className="text-[12px] font-medium tracking-[0.08em] text-accent uppercase">The Taskdeck Blog</p>
          <h1 className="mx-auto mt-3 max-w-[18ch] text-[36px] leading-[1.08] font-medium tracking-[-0.03em] md:text-[52px]">Plan less. Finish more.</h1>
          <p className="mx-auto mt-4 max-w-[34rem] text-[16px] leading-relaxed text-muted md:text-[17px]">
            Practical ideas for planning your day, keeping your list short and getting the important things done.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1080px] px-4 py-10 sm:px-6 md:py-14">
        {featured && (
          <>
            <p className="mb-4 text-[12px] font-medium tracking-[0.06em] text-muted uppercase">Featured</p>
            <a
              href={`/blog/${featured.slug}`}
              className="card-surface group grid overflow-hidden rounded-[24px] transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-float md:grid-cols-[1.05fr_1fr]"
            >
              <CoverArt className="h-56 md:h-auto md:min-h-[320px]" />
              <div className="flex flex-col p-6 md:p-8">
                <PostMeta post={featured} />
                <h2 className="mt-4 text-[24px] leading-tight font-medium tracking-[-0.02em] md:text-[28px]">{featured.title}</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{featured.description}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[14px] font-medium text-accent">
                  Read article
                  <ArrowRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
                </span>
              </div>
            </a>
          </>
        )}

        {rest.length > 0 && (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {rest.map((p) => (
              <li key={p.slug}>
                <a href={`/blog/${p.slug}`} className="card-surface block rounded-[20px] p-5 transition-shadow duration-200 hover:shadow-float">
                  <PostMeta post={p} />
                  <h2 className="mt-3 text-[18px] leading-snug font-medium tracking-[-0.015em]">{p.title}</h2>
                  <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-muted">{p.description}</p>
                </a>
              </li>
            ))}
          </ul>
        )}

        <CtaBand className="mt-12" />
      </div>
    </div>
  );
}

function Article({ post }: { post: Post }) {
  useEffect(() => setMeta(`${post.title} · Taskdeck Blog`, post.description), [post]);

  const headings = post.body.filter((b): b is Extract<Block, { type: 'h2' }> => b.type === 'h2').map((b) => ({ id: slugify(b.text), text: b.text }));
  const progressRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(headings[0]?.id);

  // One passive scroll handler: the progress bar is written straight to its transform (no re-render), and the
  // current section is the last heading scrolled past, so fast jumps never skip it.
  useEffect(() => {
    const onScroll = () => {
      const bar = progressRef.current;
      if (bar) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      }
      let current = headings[0]?.id;
      for (const h of headings) {
        const node = document.getElementById(h.id);
        if (node && node.getBoundingClientRect().top <= 120) current = h.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [post]);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 h-[3px]" aria-hidden>
        <div ref={progressRef} className="h-full origin-left bg-accent" style={{ transform: 'scaleX(0)' }} />
      </div>

      <article className="mx-auto max-w-[1080px] animate-fade-in px-4 pt-8 pb-16 sm:px-6 md:pt-10">
        <a href="/blog" className="-ml-2 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-muted transition-colors hover:bg-hover hover:text-fg">
          <ArrowLeft className="size-4" />
          All articles
        </a>

        <header className="mx-auto mt-6 max-w-[760px] text-center">
          <PostMeta post={post} className="justify-center" />
          <h1 className="mt-4 text-[32px] leading-[1.1] font-medium tracking-[-0.03em] md:text-[46px]">{post.title}</h1>
          <p className="mt-4 text-[17px] leading-relaxed text-muted md:text-[18px]">{post.description}</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-accent-soft">
              <Logo className="size-5" />
            </span>
            <span className="text-left">
              <span className="block text-[14px] font-medium">Taskdeck Team</span>
              <span className="block text-[12.5px] text-muted">Notes on planning and focus</span>
            </span>
          </div>
        </header>

        <CoverArt className="mt-10 h-56 rounded-[24px] md:h-80" />

        <div className="mt-12 lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-14">
          <div className="mx-auto w-full max-w-[680px]">
            {post.body.map((block, i) => (
              <BlockView key={i} block={block} />
            ))}
            <ShareRow />
            <CtaBand className="mt-10" />
          </div>

          {headings.length > 0 && (
            <nav aria-label="On this page" className="hidden lg:block">
              <div className="sticky top-24">
                <p className="text-[12px] font-medium tracking-[0.06em] text-muted uppercase">On this page</p>
                <ul className="mt-3 flex flex-col border-l border-line">
                  {headings.map((h) => (
                    <li key={h.id}>
                      <a
                        href={`#${h.id}`}
                        className={cn(
                          '-ml-px block border-l-2 py-1.5 pl-3 text-[13px] leading-snug transition-colors duration-150',
                          active === h.id ? 'border-accent font-medium text-fg' : 'border-transparent text-muted hover:text-fg',
                        )}
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          )}
        </div>
      </article>
    </>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'h2':
      return (
        <h2 id={slugify(block.text)} className="mt-12 mb-4 scroll-mt-24 text-[24px] leading-snug font-medium tracking-[-0.02em] first:mt-0">
          {block.text}
        </h2>
      );
    case 'p':
      return <p className="mb-5 text-[17px] leading-[1.8] text-fg/85">{block.text}</p>;
    case 'ul':
    case 'ol': {
      const List = block.type;
      return (
        <List className={cn('mb-6 flex flex-col gap-2.5 pl-6 text-[17px] leading-[1.7] text-fg/85 marker:text-accent', block.type === 'ul' ? 'list-disc' : 'list-decimal marker:font-medium')}>
          {block.items.map((item) => (
            <li key={item} className="pl-1.5">
              {item}
            </li>
          ))}
        </List>
      );
    }
    case 'tip':
      return (
        <aside className="relative mb-7 overflow-hidden rounded-2xl border border-line bg-elevated py-4 pr-5 pl-5">
          <span className="absolute inset-y-0 left-0 w-1 bg-accent" aria-hidden />
          <p className="flex items-center gap-2 text-[12.5px] font-medium tracking-[0.04em] text-accent uppercase">
            <Lamp className="size-4" />
            Tip
          </p>
          <p className="mt-1.5 text-[15.5px] leading-relaxed text-fg/85">{block.text}</p>
        </aside>
      );
  }
}

function ShareRow() {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
      <a href="/blog" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-muted transition-colors hover:text-fg">
        <ArrowLeft className="size-4" />
        All articles
      </a>
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(location.href).then(() => setCopied(true))}
        className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-hover px-3.5 text-[13px] font-medium transition-[background-color,transform] duration-150 ease-out hover:bg-line active:scale-[0.97]"
      >
        {copied ? <Check className="size-4 text-accent" /> : <Copy className="size-4" />}
        {copied ? 'Link copied' : 'Copy link'}
      </button>
    </div>
  );
}

function CtaBand({ className }: { className?: string }) {
  return (
    <section className={cn('card-surface relative overflow-hidden rounded-[24px] p-6 md:p-8', className)}>
      <div
        className="absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(70% 140% at 100% 0%, color-mix(in oklab, var(--accent) 14%, transparent), transparent 65%)' }}
        aria-hidden
      />
      <div className="relative flex flex-col items-start gap-5 md:flex-row md:items-center">
        <Logo className="size-12 shrink-0" />
        <div className="flex-1">
          <p className="text-[19px] leading-snug font-medium tracking-[-0.015em]">Plan your day in Taskdeck</p>
          <p className="mt-1 text-[14.5px] leading-relaxed text-muted">Fast, offline and private. Open it, type a task, press Enter.</p>
        </div>
        <a href="/" className="btn-primary inline-flex h-11 items-center gap-1.5 rounded-[14px] px-5 text-[14px] font-medium">
          Open the app
          <ArrowRight className="size-4" />
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-4 px-4 py-8 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2">
          <Logo className="size-5" />
          <span className="font-medium text-fg">Taskdeck</span>
          <span className="text-faint">·</span>
          Plan less. Finish more.
        </p>
        <nav aria-label="Footer" className="flex gap-5">
          <a href="/" className="transition-colors hover:text-fg">
            App
          </a>
          <a href="/blog" className="transition-colors hover:text-fg">
            Blog
          </a>
        </nav>
      </div>
    </footer>
  );
}

function NotFound() {
  useEffect(() => setMeta('Article not found · Taskdeck Blog', 'This article does not exist.'), []);
  return (
    <div className="mx-auto max-w-[680px] px-4 py-20 text-center">
      <h1 className="text-[24px] font-medium">Article not found</h1>
      <p className="mt-2 text-[15px] text-muted">It may have moved or never existed.</p>
      <a href="/blog" className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-[12px] bg-hover px-4 text-[13.5px] font-medium hover:bg-line">
        <ArrowLeft className="size-4" />
        All articles
      </a>
    </div>
  );
}
