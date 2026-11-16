export const SECTION_TAB_TYPES = {
  rules: 'Articoli',
  showcase: 'Video',
  materials: 'Documenti',
} as const;

export type SectionTabKind = keyof typeof SECTION_TAB_TYPES;
export type SectionTab = { id: string; kind: SectionTabKind; title: string; archived?: boolean };
type TabbedSection = { id: string; sectionTabs?: SectionTab[] };

export function getSectionTabs(section: TabbedSection): SectionTab[] {
  if (section.sectionTabs) return section.sectionTabs;

  const tabs: SectionTab[] = [{ id: 'rules', kind: 'rules', title: 'Articoli' }];
  const videoTitle = section.id === 'kyorugi' ? 'Gestualità'
    : section.id === 'poomsae' ? 'Esecuzioni'
    : section.id === 'freestyle' ? 'Tecniche in evidenza' : null;
  if (videoTitle) tabs.push({ id: 'showcase', kind: 'showcase', title: videoTitle });
  tabs.push({ id: 'materials', kind: 'materials', title: 'Documenti' });
  return tabs;
}

export function hasSectionTab(section: TabbedSection, kind: SectionTabKind, item: { tabId?: string }) {
  return getSectionTabs(section).some(tab => !tab.archived && tab.kind === kind && tab.id === (item.tabId ?? kind));
}
