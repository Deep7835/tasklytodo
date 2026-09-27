import {
  Airplane,
  BookOpen,
  Briefcase,
  Broom,
  ChefHat,
  Code,
  Confetti,
  DocumentText,
  Dumbbell,
  Global,
  GraduationCap,
  Mobile,
  Rocket,
  ShoppingCart,
  Suitcase,
  Sunrise,
  Target,
  Truck,
  VideoPlay,
  Wallet,
  type IconComponent,
} from 'reicon-react';
import type { CategoryColor } from '../store/types';

export type TemplateCategory =
  | 'Personal'
  | 'Work'
  | 'Business'
  | 'Study'
  | 'Health'
  | 'Finance'
  | 'Home'
  | 'Travel'
  | 'Content'
  | 'Development'
  | 'Events';

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'Personal',
  'Work',
  'Business',
  'Study',
  'Health',
  'Finance',
  'Home',
  'Travel',
  'Content',
  'Development',
  'Events',
];

/** Color given to the list a template creates. */
const CATEGORY_COLOR: Record<TemplateCategory, CategoryColor> = {
  Personal: 'blue',
  Work: 'violet',
  Business: 'indigo',
  Study: 'teal',
  Health: 'green',
  Finance: 'amber',
  Home: 'orange',
  Travel: 'teal',
  Content: 'red',
  Development: 'slate',
  Events: 'pink',
};

export interface TemplateSection {
  /** `null` = tasks without a heading. */
  title: string | null;
  tasks: string[];
}

export interface Template {
  id: string;
  name: string;
  icon: IconComponent;
  description: string;
  category: TemplateCategory;
  /** Shown under "Popular". */
  featured?: boolean;
  sections: TemplateSection[];
}

const flat = (...tasks: string[]): TemplateSection[] => [{ title: null, tasks }];

export const TEMPLATES: Template[] = [
  {
    id: 'daily-routine',
    name: 'Daily Routine',
    icon: Sunrise,
    description: 'A steady morning and evening routine to start and end each day well.',
    category: 'Personal',
    featured: true,
    sections: [
      { title: 'Morning routine', tasks: ['Wake up', 'Drink water', 'Exercise', 'Shower', 'Breakfast', 'Review today’s tasks'] },
      { title: 'Evening routine', tasks: ['Review completed tasks', 'Plan tomorrow', 'Prepare for bed'] },
    ],
  },
  {
    id: 'work-day',
    name: 'Work Day',
    icon: Briefcase,
    description: 'Plan priorities, stay on top of communication and close the day cleanly.',
    category: 'Work',
    featured: true,
    sections: flat(
      'Review emails',
      'Review calendar',
      'Plan today’s priorities',
      'Complete priority task',
      'Team communication',
      'Follow up with clients',
      'Review completed work',
      'Plan tomorrow',
    ),
  },
  {
    id: 'project-launch',
    name: 'Project Launch',
    icon: Rocket,
    description: 'A complete checklist for planning, building and launching a project.',
    category: 'Business',
    featured: true,
    sections: [
      { title: 'Planning', tasks: ['Define project goal', 'Define requirements', 'Create timeline'] },
      { title: 'Development', tasks: ['Build MVP', 'Internal testing', 'Fix bugs'] },
      { title: 'Launch', tasks: ['Prepare landing page', 'Configure domain', 'Set up analytics', 'Prepare announcement', 'Launch'] },
      { title: 'Post launch', tasks: ['Monitor analytics', 'Collect feedback', 'Fix critical issues'] },
    ],
  },
  {
    id: 'website-launch',
    name: 'Website Launch',
    icon: Global,
    description: 'From domain and hosting to SEO, testing and going live.',
    category: 'Development',
    featured: true,
    sections: flat(
      'Buy domain',
      'Set up hosting',
      'Configure DNS',
      'Set up database',
      'Build homepage',
      'Build core pages',
      'Add SEO metadata',
      'Create sitemap',
      'Set up analytics',
      'Test mobile',
      'Test forms',
      'Submit to search engines',
      'Launch',
    ),
  },
  {
    id: 'grocery-shopping',
    name: 'Grocery Shopping',
    icon: ShoppingCart,
    description: 'A shopping list grouped by aisle so nothing gets forgotten.',
    category: 'Home',
    featured: true,
    sections: [
      { title: 'Produce', tasks: ['Vegetables', 'Fruits'] },
      { title: 'Dairy', tasks: ['Milk', 'Eggs', 'Cheese'] },
      { title: 'Pantry', tasks: ['Rice', 'Bread', 'Pasta', 'Snacks'] },
      { title: 'Household', tasks: ['Detergent', 'Toilet paper'] },
    ],
  },
  {
    id: 'weekly-cleaning',
    name: 'Weekly Home Cleaning',
    icon: Broom,
    description: 'One pass through the house each week, room by room.',
    category: 'Home',
    featured: true,
    sections: flat(
      'Clean bedroom',
      'Clean bathroom',
      'Vacuum floors',
      'Mop floors',
      'Clean kitchen',
      'Change bedsheets',
      'Take out trash',
      'Organize workspace',
    ),
  },
  {
    id: 'content-creation',
    name: 'Content Creation',
    icon: DocumentText,
    description: 'Take an article from idea to published and promoted.',
    category: 'Content',
    featured: true,
    sections: [
      { title: 'Idea', tasks: ['Research topic', 'Define target audience'] },
      { title: 'Production', tasks: ['Create outline', 'Write first draft', 'Add images', 'Add internal links'] },
      { title: 'Review', tasks: ['Proofread', 'Check SEO', 'Check links'] },
      { title: 'Publish', tasks: ['Publish article', 'Share on social media', 'Monitor performance'] },
    ],
  },
  {
    id: 'social-media-post',
    name: 'Social Media Post',
    icon: Mobile,
    description: 'Write, design and schedule a post, then track how it does.',
    category: 'Content',
    sections: flat(
      'Choose topic',
      'Research',
      'Write hook',
      'Write caption',
      'Create visual',
      'Add CTA',
      'Proofread',
      'Schedule post',
      'Publish',
      'Track engagement',
    ),
  },
  {
    id: 'youtube-video',
    name: 'YouTube Video',
    icon: VideoPlay,
    description: 'Research, script, record, edit and publish a video.',
    category: 'Content',
    featured: true,
    sections: [
      { title: 'Research', tasks: ['Choose topic', 'Research competitors', 'Collect sources'] },
      { title: 'Production', tasks: ['Write hook', 'Write script', 'Record voice', 'Record footage', 'Edit video'] },
      { title: 'Publishing', tasks: ['Create thumbnail', 'Write title', 'Write description', 'Add tags', 'Upload', 'Publish'] },
    ],
  },
  {
    id: 'study-plan',
    name: 'Study Plan',
    icon: BookOpen,
    description: 'Organize materials, work through chapters and test yourself.',
    category: 'Study',
    featured: true,
    sections: flat(
      'Define subjects',
      'Gather study materials',
      'Create weekly schedule',
      'Study chapter 1',
      'Study chapter 2',
      'Make notes',
      'Practice questions',
      'Take mock test',
      'Review mistakes',
    ),
  },
  {
    id: 'exam-preparation',
    name: 'Exam Preparation',
    icon: GraduationCap,
    description: 'Plan, study and revise in rounds before the big day.',
    category: 'Study',
    sections: [
      { title: 'Planning', tasks: ['Collect syllabus', 'Identify weak subjects', 'Create study schedule'] },
      { title: 'Study', tasks: ['Complete theory', 'Create notes', 'Practice questions', 'Solve previous papers'] },
      { title: 'Revision', tasks: ['Revision 1', 'Revision 2', 'Mock exam', 'Final revision'] },
    ],
  },
  {
    id: 'monthly-budget',
    name: 'Monthly Budget',
    icon: Wallet,
    description: 'Track income, pay the bills and plan next month’s spending.',
    category: 'Finance',
    featured: true,
    sections: flat(
      'Record income',
      'Calculate fixed expenses',
      'Review subscriptions',
      'Pay rent',
      'Pay utilities',
      'Review credit cards',
      'Set savings target',
      'Review spending',
      'Plan next month',
    ),
  },
  {
    id: 'travel-planning',
    name: 'Travel Planning',
    icon: Airplane,
    description: 'Book, prepare and travel without last-minute surprises.',
    category: 'Travel',
    featured: true,
    sections: [
      { title: 'Planning', tasks: ['Choose destination', 'Set budget', 'Book flights', 'Book hotel'] },
      {
        title: 'Before the trip',
        tasks: ['Check passport', 'Check visa', 'Buy travel insurance', 'Prepare itinerary', 'Pack bags', 'Exchange currency'],
      },
      { title: 'Travel', tasks: ['Airport check-in', 'Hotel check-in', 'Follow itinerary'] },
    ],
  },
  {
    id: 'packing-list',
    name: 'Packing List',
    icon: Suitcase,
    description: 'Documents, clothes, electronics and essentials for any trip.',
    category: 'Travel',
    sections: [
      { title: 'Documents', tasks: ['Passport', 'ID', 'Tickets', 'Hotel booking'] },
      { title: 'Clothing', tasks: ['Shirts', 'Pants', 'Underwear', 'Shoes'] },
      { title: 'Electronics', tasks: ['Phone', 'Charger', 'Power bank', 'Laptop'] },
      { title: 'Personal', tasks: ['Toiletries', 'Medicines', 'Sunglasses'] },
    ],
  },
  {
    id: 'workout-plan',
    name: 'Workout Plan',
    icon: Dumbbell,
    description: 'A full session from warm-up to stretching.',
    category: 'Health',
    featured: true,
    sections: flat('Warm-up', 'Cardio', 'Strength training', 'Core', 'Stretching', 'Record workout', 'Drink water'),
  },
  {
    id: 'meal-planning',
    name: 'Meal Planning',
    icon: ChefHat,
    description: 'Plan the week’s meals, shop once and prep ahead.',
    category: 'Health',
    sections: flat('Plan breakfast', 'Plan lunch', 'Plan dinner', 'Create grocery list', 'Buy groceries', 'Meal prep', 'Prepare containers'),
  },
  {
    id: 'moving-house',
    name: 'Moving House',
    icon: Truck,
    description: 'Everything before, during and after a move.',
    category: 'Home',
    sections: [
      { title: 'Before moving', tasks: ['Find new home', 'Sign agreement', 'Book movers', 'Notify landlord', 'Change address'] },
      { title: 'Packing', tasks: ['Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Storage'] },
      { title: 'After moving', tasks: ['Set up internet', 'Update address', 'Unpack essentials', 'Organize rooms'] },
    ],
  },
  {
    id: 'event-planning',
    name: 'Event Planning',
    icon: Confetti,
    description: 'Plan, prepare and run an event from guest list to clean-up.',
    category: 'Events',
    sections: [
      { title: 'Planning', tasks: ['Choose date', 'Set budget', 'Create guest list', 'Choose venue'] },
      { title: 'Preparation', tasks: ['Send invitations', 'Order food', 'Arrange decorations', 'Prepare music', 'Buy supplies'] },
      { title: 'Event day', tasks: ['Set up venue', 'Confirm vendors', 'Welcome guests', 'Clean up'] },
    ],
  },
  {
    id: 'personal-goals',
    name: 'Personal Goals',
    icon: Target,
    description: 'Turn a goal into milestones and weekly actions you can track.',
    category: 'Personal',
    sections: flat(
      'Define goal',
      'Define why it matters',
      'Set deadline',
      'Break into milestones',
      'Create weekly actions',
      'Track progress',
      'Review progress',
    ),
  },
  {
    id: 'software-development',
    name: 'Software Development',
    icon: Code,
    description: 'Requirements, build, QA and deployment for a software project.',
    category: 'Development',
    sections: [
      { title: 'Planning', tasks: ['Define requirements', 'Create user stories', 'Design architecture'] },
      {
        title: 'Development',
        tasks: ['Set up repository', 'Set up database', 'Build frontend', 'Build backend', 'Add authentication', 'Add tests'],
      },
      { title: 'QA', tasks: ['Test functionality', 'Test mobile', 'Fix bugs', 'Security review'] },
      { title: 'Deployment', tasks: ['Configure production', 'Deploy', 'Set up monitoring', 'Verify production'] },
    ],
  },
];

export const templateColor = (t: Template): CategoryColor => CATEGORY_COLOR[t.category];
export const taskCount = (t: Template) => t.sections.reduce((n, s) => n + s.tasks.length, 0);
export const sectionCount = (t: Template) => t.sections.filter((s) => s.title).length;

/** The template's tasks in order, ready to copy into a new list. */
export const templateItems = (t: Template) => t.sections.flatMap((s) => s.tasks.map((title) => ({ title, section: s.title })));

export function matchesTemplate(t: Template, q: string) {
  const hay = [t.name, t.description, t.category, ...t.sections.flatMap((s) => [s.title ?? '', ...s.tasks])].join(' ').toLowerCase();
  return hay.includes(q);
}
