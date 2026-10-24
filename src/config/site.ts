export interface LinkItem { label: string; url: string }

export interface ExperienceEntry {
  kind: 'work' | 'education' | 'course'
  organization: string
  role: string
  start: string
  end: string
  location?: string
  description: string
  skills: string[]
  achievements?: string[]
  draft?: boolean
}

export interface Achievement {
  title: string
  description: string
  date?: string
  issuer?: string
  verifyUrl?: string
  kind: 'certification' | 'award' | 'hackathon' | 'competition' | 'milestone'
  draft?: boolean
}

export interface Service {
  title: string
  description: string
  icon: 'pickaxe' | 'sword' | 'crafting' | 'chest' | 'diamond' | 'emerald' | 'compass' | 'map'
  draft?: boolean
}

export interface Testimonial {
  name: string
  role: string
  quote: string
  url?: string
  draft?: boolean
}

export interface LearningItem {
  name: string
  stage: 'exploring' | 'building' | 'applying'
  note: string
  draft?: boolean
}

export interface JourneyMilestone {
  date: string
  title: string
  description: string
  icon?: 'diamond' | 'emerald' | 'pickaxe' | 'book' | 'star' | 'chest' | 'map'
  draft?: boolean
}

export interface InterestItem {
  title: string
  detail: string
  icon: 'diamond' | 'emerald' | 'pickaxe' | 'book' | 'star' | 'chest' | 'map' | 'compass' | 'sword'
  draft?: boolean
}

export interface SiteConfig {
  githubUsername: string
  displayNameOverride: string
  title: string
  heroIntro: string
  about: {
    bio: string
    interests: string
    approach: string
    philosophy: string
    goals: string
    draft?: boolean
  }
  contact: {
    email: string
    showGithubEmail: boolean
    formEndpoint: string
    links: LinkItem[]
  }
  cv: { path: string; label: string }
  featuredRepos: string[]
  hiddenRepos: string[]
  skin: { path: string; slim: 'auto' | boolean; cape: boolean }
  experience: ExperienceEntry[]
  achievements: Achievement[]
  services: Service[]
  testimonials: Testimonial[]
  learning: LearningItem[]
  journey: JourneyMilestone[]
  interests: InterestItem[]
}

export const site: SiteConfig = {
  githubUsername: import.meta.env.VITE_GITHUB_USERNAME || 'mohdalmadhon',
  displayNameOverride: '',
  title: 'Full-Stack Developer',
  heroIntro:
    'I design and build web applications end to end, from responsive, interactive interfaces to the APIs, real-time services and databases behind them.',
  about: {
    bio: 'I am a full-stack developer who enjoys turning ideas into complete, working products. I like building things from first principles so I understand every layer of the stack.',
    interests:
      'Interactive web experiences, real-time systems, backend services and APIs, and the craft of making interfaces feel fast and alive.',
    approach:
      'Break the problem down, build the smallest thing that works, measure it, and iterate. I prefer readable code, clear data models and honest trade-offs over cleverness.',
    philosophy:
      'Software should be understandable by the next person who opens it. Good tools disappear and let people focus on what they came to do.',
    goals:
      'Grow as an engineer by shipping real projects, deepening my backend and systems knowledge, and contributing to teams building meaningful products.',
  },
  contact: {
    email: 'mohammedalmadhoon000@gmail.com',
    showGithubEmail: false,
    formEndpoint: import.meta.env.VITE_CONTACT_ENDPOINT || 'https://formsubmit.co/ajax/mohammedalmadhoon000@gmail.com',
    links: [],
  },
  cv: { path: 'cv.pdf', label: 'Download CV' },
  featuredRepos: [],
  hiddenRepos: [],
  skin: { path: 'skin.png', slim: 'auto', cape: false },
  experience: [
    {
      kind: 'education',
      organization: 'Your institution',
      role: 'Program or degree',
      start: 'YYYY',
      end: 'Present',
      description: 'Describe what you studied and the kind of projects you built.',
      skills: ['Add', 'Relevant', 'Skills'],
      draft: true,
    },
    {
      kind: 'work',
      organization: 'Company name',
      role: 'Role title',
      start: 'MMM YYYY',
      end: 'MMM YYYY',
      description: 'Summarize your responsibilities and the impact of your work.',
      skills: ['Add', 'Skills'],
      achievements: ['Add a measurable achievement'],
      draft: true,
    },
  ],
  achievements: [
    {
      title: 'Your first certification',
      description: 'Replace with a real certificate, award or hackathon result.',
      date: 'YYYY',
      kind: 'certification',
      draft: true,
    },
  ],
  services: [
    { title: 'Full-stack web development', description: 'Complete web applications, from the user interface to the API and database.', icon: 'pickaxe' },
    { title: 'Frontend development', description: 'Responsive, accessible and interactive interfaces with modern JavaScript and TypeScript.', icon: 'crafting' },
    { title: 'Backend & API development', description: 'REST and real-time APIs, authentication and business logic on a reliable server.', icon: 'sword' },
    { title: 'Database design', description: 'Data models, schemas and queries that stay correct and fast as data grows.', icon: 'chest' },
    { title: 'Performance optimization', description: 'Profiling and fixing slow pages, heavy bundles and expensive queries.', icon: 'diamond' },
    { title: 'Deployment & maintenance', description: 'Shipping to production, automating builds and keeping projects healthy.', icon: 'compass' },
  ],
  testimonials: [],
  learning: [
    { name: 'Add a technology', stage: 'exploring', note: 'What you are exploring and why.', draft: true },
    { name: 'Add another', stage: 'building', note: 'What you are building with it.', draft: true },
  ],
  journey: [
    { date: 'YYYY', title: 'Wrote my first program', description: 'Describe the language and what you built.', icon: 'book', draft: true },
    { date: 'YYYY', title: 'Shipped my first full-stack project', description: 'Describe the project and what you learned.', icon: 'pickaxe', draft: true },
  ],
  interests: [
    { title: 'Add an interest', detail: 'Something you enjoy outside of code.', icon: 'compass', draft: true },
  ],
}
