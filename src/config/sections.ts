import { site } from './site'
import { posts } from '../content/blog'
import { published } from './drafts'

export { showDrafts, published } from './drafts'

export type IconName =
  | 'home' | 'face' | 'crafting' | 'chest' | 'chart' | 'map' | 'star' | 'pickaxe' | 'sword' | 'quote'
  | 'book' | 'compass' | 'diamond' | 'emerald' | 'envelope'

export interface SectionDef {
  id: string
  title: string
  icon: IconName
  hotbar: boolean
  visible: boolean
}

export function getSections(): SectionDef[] {
  const list: SectionDef[] = [
    { id: 'hero', title: 'Home', icon: 'home', hotbar: true, visible: true },
    { id: 'about', title: 'About', icon: 'face', hotbar: true, visible: true },
    { id: 'skills', title: 'Skills', icon: 'crafting', hotbar: true, visible: true },
    { id: 'projects', title: 'Projects', icon: 'chest', hotbar: true, visible: true },
    { id: 'activity', title: 'Activity', icon: 'chart', hotbar: true, visible: true },
    { id: 'experience', title: 'Education', icon: 'book', hotbar: true, visible: published(site.experience).length > 0 },
    { id: 'achievements', title: 'Achievements', icon: 'star', hotbar: false, visible: published(site.achievements).length > 0 },
    { id: 'services', title: 'Services', icon: 'pickaxe', hotbar: true, visible: published(site.services).length > 0 },
    { id: 'testimonials', title: 'Testimonials', icon: 'quote', hotbar: false, visible: published(site.testimonials).length > 0 },
    { id: 'blog', title: 'Writing', icon: 'book', hotbar: true, visible: posts.length > 0 },
    { id: 'learning', title: 'Learning', icon: 'emerald', hotbar: false, visible: published(site.learning).length > 0 },
    { id: 'journey', title: 'Journey', icon: 'compass', hotbar: false, visible: published(site.journey).length > 0 },
    { id: 'interests', title: 'Interests', icon: 'diamond', hotbar: false, visible: published(site.interests).length > 0 },
    { id: 'contact', title: 'Contact', icon: 'envelope', hotbar: true, visible: true },
  ]
  return list.filter((s) => s.visible)
}
