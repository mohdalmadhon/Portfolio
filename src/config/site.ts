export interface LinkItem { label: string; url: string }

export interface ExperienceEntry {
  kind: 'work' | 'education' | 'course'
  organization: string
  role: string
  start?: string
  end?: string
  expected?: string
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
    development: string
    developmentAreas: string[]
    interests: string
    goals: string
    approach: string
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
    bio: 'I am a developer who enjoys turning ideas into complete, working products, and I like building things from first principles so I understand every layer.',
    development: 'Game development comes first: building games and the systems behind them. I am also drawn to systems programming and to web development, where I build full-stack applications end to end.',
    developmentAreas: ['Game development', 'Systems programming', 'Web development'],
    interests: 'I am a big fan of Formula One and motorsport: the engineering, the race strategy and the speed behind every lap.',
    goals: 'Complete the development of my first game, and build a mini game engine in Rust or C++.',
    approach:
      'Break the problem down, build the smallest thing that works, measure it, and iterate. I prefer readable code, clear data models and honest trade-offs over cleverness.',
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
      organization: 'Reboot Coding Institute',
      role: 'Full-Stack Development',
      expected: 'August 2027',
      description: '',
      skills: [],
    },
    {
      kind: 'education',
      organization: 'Bahrain Polytechnic',
      role: 'Programming',
      expected: 'June 2028',
      description: '',
      skills: [],
    },
  ],
  achievements: [],
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
