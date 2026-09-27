/** A block of article content. Kept as plain data so posts render with one shared typography. */
export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'tip'; text: string };

export interface Post {
  slug: string;
  title: string;
  description: string;
  /** `YYYY-MM-DD`. */
  date: string;
  tag: string;
  body: Block[];
}

export const POSTS: Post[] = [
  {
    slug: 'a-to-do-list-you-actually-finish',
    title: 'How to Build a To-Do List You Actually Finish',
    description:
      'Most to-do lists fail for the same few reasons. Here is a simple daily routine, from brain dump to evening review, that keeps your list short, clear and done.',
    date: '2026-09-27',
    tag: 'Productivity',
    body: [
      {
        type: 'p',
        text: 'Almost everyone has started a to-do list with good intentions and abandoned it a week later. The list grew longer every day, the important things hid between small chores, and opening it started to feel like a reminder of everything you had not done. The problem is rarely discipline. It is usually the way the list is built.',
      },
      {
        type: 'p',
        text: 'A good list is not a storage room for every thought you have ever had. It is a short, honest plan for what you will do next. The routine below takes a few minutes a day, and it works in any app, although we will show how it maps to Taskly along the way.',
      },
      { type: 'h2', text: '1. Start with a brain dump' },
      {
        type: 'p',
        text: 'Before you can plan, you need to see everything that is competing for your attention. Take five minutes and write down every task, errand and loose end you can think of: the email you owe, the bill that is due, the idea for a side project. Do not sort or judge anything yet. The goal is simply to get it out of your head, where it keeps interrupting you, and onto a list you can trust.',
      },
      {
        type: 'tip',
        text: 'In Taskly, press N and just keep typing and pressing Enter. Capturing should be faster than thinking about where something belongs.',
      },
      { type: 'h2', text: '2. Rewrite tasks as next actions' },
      {
        type: 'p',
        text: 'Vague tasks are the main reason lists stall. “Taxes” or “Website” are projects, not things you can sit down and do. When you look at them, your brain has to work out the first step all over again, so you skip them. Rewrite each item so it starts with a verb and describes one concrete action.',
      },
      {
        type: 'ul',
        items: [
          '“Taxes” becomes “Download last year’s tax return from the portal”.',
          '“Website” becomes “Write the headline for the homepage”.',
          '“Mum’s birthday” becomes “Order flowers for Saturday delivery”.',
        ],
      },
      {
        type: 'p',
        text: 'A task you can start in the next two minutes is a task you will actually start.',
      },
      { type: 'h2', text: '3. Pick three that matter today' },
      {
        type: 'p',
        text: 'Not every task deserves the same attention. Each morning, choose up to three tasks that would make the day a success if they were the only things you finished. Mark them as high priority and do them first, before the inbox and the small stuff take over. Everything else is a bonus.',
      },
      {
        type: 'tip',
        text: 'Add !high when you type a task, for example “Send the proposal to Sam !high”, and it gets a red priority flag you can spot at a glance.',
      },
      { type: 'h2', text: '4. Give tasks a day, not just a deadline' },
      {
        type: 'p',
        text: 'A deadline tells you when something is too late. A day tells you when you will actually do it. Instead of letting every task float in one endless list, assign each one to a specific day. Your Today view then becomes a realistic plan instead of a wish list, and anything you did not finish is easy to move rather than silently rot.',
      },
      {
        type: 'p',
        text: 'Taskly understands plain words at the end of a task: “tomorrow”, “friday” or “on monday” set the due date for you, and the Today filter shows only what is due now or overdue.',
      },
      { type: 'h2', text: '5. Group work into lists and sections' },
      {
        type: 'p',
        text: 'Mixing groceries, client work and holiday plans in one column makes everything harder to read. Keep a handful of lists for the main areas of your life, and inside bigger projects use sections to show the order of work: Planning, Doing, Review. You always know what stage a project is in and what comes next.',
      },
      {
        type: 'p',
        text: 'If a project follows a familiar shape, such as a trip, a product launch or a weekly clean, start from a template instead of a blank page. Taskly copies the template into a new list, so you can edit, reorder or delete anything without changing the original.',
      },
      { type: 'h2', text: '6. Review for two minutes every evening' },
      {
        type: 'p',
        text: 'The habit that keeps a list alive is a short daily review. Before you finish for the day, look at what is left, move unfinished tasks to a new day, delete anything that no longer matters, and pick tomorrow’s three priorities. It takes two minutes, and it means you start the next morning with a plan instead of a pile.',
      },
      { type: 'h2', text: '7. Keep the list small and celebrate progress' },
      {
        type: 'p',
        text: 'A list that only grows starts to feel like a burden. Clear out completed tasks regularly and be ruthless with items you keep postponing: either schedule them properly or let them go. At the same time, notice what you have done. Seeing a streak of finished days is a quiet but powerful motivator, which is why Taskly shows your activity as a simple grid of completed days.',
      },
      { type: 'h2', text: 'Your quick-start checklist' },
      {
        type: 'ol',
        items: [
          'Brain dump everything onto one list.',
          'Rewrite each item as a clear next action that starts with a verb.',
          'Choose up to three high-priority tasks for today.',
          'Give every task a day, not just a deadline.',
          'Group tasks into lists, and use sections for bigger projects.',
          'Review for two minutes each evening and plan tomorrow.',
          'Clear completed tasks and let go of what no longer matters.',
        ],
      },
      {
        type: 'p',
        text: 'None of these steps needs special software, but a fast, focused tool removes the friction. Taskly works offline, keeps everything on your device and shows what is due today the moment you open it. Type, press Enter, and get on with your day.',
      },
    ],
  },
];

const WORDS_PER_MINUTE = 220;

export function wordCount(post: Post): number {
  const text = post.body.flatMap((b) => ('items' in b ? b.items : [b.text])).join(' ');
  return text.split(/\s+/).filter(Boolean).length;
}

export const readMinutes = (post: Post) => Math.max(1, Math.round(wordCount(post) / WORDS_PER_MINUTE));
