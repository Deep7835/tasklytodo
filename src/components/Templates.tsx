import { useRef, useState } from 'react';
import {
  Airplane,
  ArrowLeft,
  BookOpen,
  Briefcase,
  Code,
  Confetti,
  Eye,
  HeartPulse,
  Home,
  Layers,
  PenTool,
  Plus,
  Search,
  SearchMinus,
  Sparkles,
  TickSquare,
  TrendUp,
  User,
  Wallet,
  X,
  type IconComponent,
} from 'reicon-react';
import { EmptyState } from './EmptyState';
import { Modal } from './Modal';
import { CATEGORY_COLORS, cn } from '../lib/ui';
import {
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  matchesTemplate,
  sectionCount,
  taskCount,
  templateColor,
  type Template,
  type TemplateCategory,
} from '../lib/templates';

type Tab = 'Popular' | TemplateCategory;
const TABS: Tab[] = ['Popular', ...TEMPLATE_CATEGORIES];

const TAB_ICON: Record<Tab, IconComponent> = {
  Popular: Sparkles,
  Personal: User,
  Work: Briefcase,
  Business: TrendUp,
  Study: BookOpen,
  Health: HeartPulse,
  Finance: Wallet,
  Home: Home,
  Travel: Airplane,
  Content: PenTool,
  Development: Code,
  Events: Confetti,
};

const TAB_COUNT = Object.fromEntries(
  TABS.map((t) => [t, TEMPLATES.filter((x) => (t === 'Popular' ? x.featured : x.category === t)).length]),
) as Record<Tab, number>;

/** The template's icon on a soft gradient tile in its category color. */
function IconTile({ template, large }: { template: Template; large?: boolean }) {
  const tint = CATEGORY_COLORS[templateColor(template)];
  const Icon = template.icon;
  return (
    <span
      className={cn('grid shrink-0 place-items-center', large ? 'size-14 rounded-2xl' : 'size-11 rounded-[13px]')}
      style={{
        color: tint,
        backgroundImage: `linear-gradient(145deg, color-mix(in oklab, ${tint} 24%, transparent), color-mix(in oklab, ${tint} 9%, transparent))`,
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${tint} 20%, transparent)`,
      }}
      aria-hidden
    >
      <Icon className={large ? 'size-7' : 'size-[22px]'} />
    </span>
  );
}

const meta = (t: Template) => {
  const s = sectionCount(t);
  return `${taskCount(t)} tasks${s ? ` · ${s} sections` : ''}`;
};

export function TemplatesView({ onUse }: { onUse: (template: Template) => void }) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('Popular');
  const [preview, setPreview] = useState<Template | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const shown = q
    ? TEMPLATES.filter((t) => matchesTemplate(t, q))
    : tab === 'Popular'
      ? TEMPLATES.filter((t) => t.featured)
      : TEMPLATES.filter((t) => t.category === tab);

  return (
    <div className="animate-fade-in">
      <h1 className="text-[26px] leading-tight font-medium tracking-[-0.025em] md:text-[24px]">Templates</h1>
      <p className="mt-1.5 text-[14px] text-muted md:mt-1 md:text-[13px]">Start faster with a ready-made workflow. Using one copies its tasks into a new list.</p>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
          placeholder="Search templates"
          aria-label="Search templates"
          className="h-11 w-full rounded-xl border border-line bg-surface pr-10 pl-10 text-[14px] outline-none transition-colors placeholder:text-faint focus:border-line-strong [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              searchRef.current?.focus();
            }}
            className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-faint hover:text-fg"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {!q && (
        // One scrollable track (same look as the segmented filters); the right edge fades to hint at more.
        <div className="mt-3 rounded-[16px] bg-section-muted p-1">
          <div
            role="tablist"
            aria-label="Template categories"
            className="flex gap-1 overflow-x-auto scrollbar-none [mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)]"
          >
            {TABS.map((t) => {
              const Icon = TAB_ICON[t];
              const selected = tab === t;
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={(e) => {
                    setTab(t);
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                  }}
                  className={cn(
                    'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[12px] pr-2 pl-2.5 text-[13px] font-medium transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.97]',
                    selected ? 'bg-elevated text-fg shadow-soft dark:bg-white/12' : 'text-muted hover:text-fg',
                  )}
                >
                  <Icon className={cn('size-4', selected ? 'text-accent' : 'text-faint')} />
                  {t}
                  <span className={cn('min-w-4 text-center text-[11.5px] tabular-nums', selected ? 'text-muted' : 'text-faint')}>{TAB_COUNT[t]}</span>
                </button>
              );
            })}
            <span className="w-5 shrink-0" aria-hidden />
          </div>
        </div>
      )}

      <div className="mt-6 mb-3 flex items-center gap-2 px-1">
        <h2 className="text-[15px] font-medium tracking-[-0.01em]">{q ? `Results for “${query.trim()}”` : tab}</h2>
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-line-strong px-1.5 text-[11.5px] font-medium text-muted tabular-nums">{shown.length}</span>
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={<SearchMinus className="size-7" />} title="No templates found" body={`Nothing matches “${query.trim()}”. Try another word.`} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {shown.map((t) => (
            <li key={t.id}>
              <TemplateCard template={t} onPreview={() => setPreview(t)} onUse={() => onUse(t)} />
            </li>
          ))}
        </ul>
      )}

      <TemplateDetail template={preview} onClose={() => setPreview(null)} onUse={onUse} />
    </div>
  );
}

function TemplateCard({ template, onPreview, onUse }: { template: Template; onPreview: () => void; onUse: () => void }) {
  const sections = sectionCount(template);
  return (
    <article className="flex h-full flex-col rounded-[20px] bg-elevated p-4 shadow-soft ring-1 ring-line transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-float">
      <button type="button" onClick={onPreview} className="flex flex-1 flex-col text-left outline-none focus-visible:rounded-xl focus-visible:ring-2 focus-visible:ring-accent/40">
        <span className="flex items-start justify-between gap-3">
          <IconTile template={template} />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-hover px-2 py-0.5 text-[11.5px] font-medium text-muted">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[templateColor(template)] }} aria-hidden />
            {template.category}
          </span>
        </span>
        <span className="mt-3.5 block text-[15.5px] font-medium tracking-[-0.01em]">{template.name}</span>
        <span className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted">{template.description}</span>
        <span className="mt-auto flex items-center gap-3.5 pt-3.5 text-[12px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <TickSquare className="size-3.5 text-faint" />
            {taskCount(template)} tasks
          </span>
          {sections > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Layers className="size-3.5 text-faint" />
              {sections} sections
            </span>
          )}
        </span>
      </button>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onPreview}
          className="inline-flex h-10 items-center gap-1.5 rounded-[12px] bg-hover px-3.5 text-[13px] font-medium text-fg/80 transition-[background-color,color,transform] duration-150 ease-out hover:bg-line hover:text-fg active:scale-[0.97]"
        >
          <Eye className="size-4" />
          Preview
        </button>
        <button type="button" onClick={onUse} className="btn-primary inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[12px] text-[13px] font-medium">
          <span className="grid size-[18px] place-items-center rounded-[6px] bg-accent-fg text-accent">
            <Plus className="size-3" strokeWidth={3} />
          </span>
          Use template
        </button>
      </div>
    </article>
  );
}

function TemplateDetail({ template, onClose, onUse }: { template: Template | null; onClose: () => void; onUse: (t: Template) => void }) {
  // Keep showing the last template while the panel animates closed.
  const last = useRef<Template | null>(null);
  if (template) last.current = template;
  const t = template ?? last.current;

  return (
    <Modal
      open={!!template}
      onClose={onClose}
      title={t ? `${t.name} template` : 'Template'}
      variant="drawer"
      hideHeader
      footer={
        t && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onUse(t);
            }}
            className="btn-primary h-11 w-full rounded-[14px] text-[14px] font-medium"
          >
            Use this template
          </button>
        )
      }
    >
      {t && (
        <div className="px-5 pb-6">
          <div className="flex items-center justify-between pt-3 md:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="-ml-2 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-muted transition-colors hover:bg-hover hover:text-fg"
            >
              <ArrowLeft className="size-4" />
              Templates
            </button>
          </div>

          <div className="mt-4 flex items-start gap-4">
            <IconTile template={t} large />
            <div className="min-w-0">
              <h3 className="text-[20px] leading-tight font-medium tracking-[-0.02em]">{t.name}</h3>
              <p className="mt-1 text-[12.5px] text-muted">
                {t.category} · {meta(t)}
              </p>
            </div>
          </div>
          <p className="mt-4 text-[14px] leading-relaxed text-muted">{t.description}</p>

          <div className="mt-5 flex flex-col gap-5 border-t border-line pt-5">
            {t.sections.map((s, i) => (
              <section key={s.title ?? i}>
                {s.title && (
                  <h4 className="mb-2 flex items-center gap-2 text-[11.5px] font-medium tracking-[0.06em] text-muted uppercase">
                    {s.title}
                    <span className="text-faint tabular-nums">{s.tasks.length}</span>
                  </h4>
                )}
                <ul className="flex flex-col gap-1.5">
                  {s.tasks.map((task) => (
                    <li key={task} className="flex items-center gap-3 rounded-xl bg-section-muted px-3 py-2.5 text-[14px]">
                      <span className="size-[17px] shrink-0 rounded-full border-[1.5px] border-line-strong" aria-hidden />
                      {task}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
