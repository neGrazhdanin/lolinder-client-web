export type MarkupTone =
  | 'name'
  | 'value'
  | 'ap'
  | 'ad'
  | 'true'
  | 'heal'
  | 'mana'
  | 'defense'
  | 'speed'
  | 'gold'
  | 'keyword'
  | 'muted'
  | 'danger';

export type MarkupNode =
  | { type: 'text'; text: string }
  | { type: 'break' }
  | { type: 'rule' }
  | { type: 'stats'; children: MarkupNode[] }
  | { type: 'bullet'; children: MarkupNode[] }
  | { type: 'span'; tone: MarkupTone; children: MarkupNode[] };

const TONES: Record<string, MarkupTone> = {
  passive: 'name',
  active: 'name',
  spellpassive: 'name',
  spellname: 'name',
  unique: 'name',
  keywordmajor: 'name',
  jadeunique: 'name',
  raritygeneric: 'name',
  raritylegendary: 'name',
  raritymythic: 'name',
  prismatic: 'name',
  titleleft: 'name',
  titleright: 'name',
  b: 'name',
  attention: 'value',
  buffedstat: 'value',
  statgood: 'value',
  magicdamage: 'ap',
  scaleap: 'ap',
  physicaldamage: 'ad',
  scalead: 'ad',
  scalelethality: 'ad',
  armorpen: 'ad',
  attackspeed: 'ad',
  scalecrit: 'ad',
  truedamage: 'true',
  healing: 'heal',
  health: 'heal',
  scalehealth: 'heal',
  shield: 'heal',
  lifesteal: 'heal',
  omnivamp: 'heal',
  scalemana: 'mana',
  scalearmor: 'defense',
  scalemr: 'defense',
  speed: 'speed',
  ms: 'speed',
  gold: 'gold',
  status: 'keyword',
  keyword: 'keyword',
  keywordstealth: 'keyword',
  onhit: 'keyword',
  rules: 'muted',
  flavortext: 'muted',
  jaderules: 'muted',
  jadelimit: 'muted',
  ornnbonus: 'muted',
  i: 'muted',
  danger: 'danger',
};

function convert(nodes: NodeListOf<ChildNode>): MarkupNode[] {
  const out: MarkupNode[] = [];
  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent) out.push({ type: 'text', text: node.textContent });
      continue;
    }
    if (!(node instanceof Element)) continue;
    const tag = node.localName;
    if (tag === 'br') {
      out.push({ type: 'break' });
      continue;
    }
    if (tag === 'hr') {
      out.push({ type: 'rule' });
      continue;
    }
    const children = convert(node.childNodes);
    if (tag === 'stats') {
      if (children.some(hasText)) out.push({ type: 'stats', children });
    } else if (tag === 'li') {
      out.push({ type: 'bullet', children });
    } else if (TONES[tag]) {
      out.push({ type: 'span', tone: TONES[tag], children });
    } else {
      // Unknown tags, <font> and <mainText> included, keep only their text.
      out.push(...children);
    }
  }
  return out;
}

function hasText(node: MarkupNode): boolean {
  if (node.type === 'text') return node.text.trim() !== '';
  return 'children' in node && node.children.some(hasText);
}

const isBlock = (node: MarkupNode | undefined) =>
  node?.type === 'stats' || node?.type === 'bullet' || node?.type === 'rule';

// Riot pads sections with runs of <br> and leaves breaks next to blocks that already start a line.
function tidy(nodes: MarkupNode[]): MarkupNode[] {
  const out: MarkupNode[] = [];
  let breaks = 0;
  for (const node of nodes) {
    if (node.type === 'break') {
      breaks += 1;
      continue;
    }
    if (breaks > 0 && out.length > 0 && !isBlock(out[out.length - 1]) && !isBlock(node)) {
      for (let index = 0; index < Math.min(breaks, 2); index += 1) out.push({ type: 'break' });
    }
    breaks = 0;
    out.push('children' in node ? { ...node, children: tidy(node.children) } : node);
  }
  return out;
}

/** Parses Data Dragon markup into plain nodes, so no Riot HTML ever reaches the DOM. */
export function parseMarkup(markup: string): MarkupNode[] {
  if (!markup) return [];
  const doc = new DOMParser().parseFromString(`<body>${markup}</body>`, 'text/html');
  return tidy(convert(doc.body.childNodes));
}

export function markupText(node: MarkupNode): string {
  if (node.type === 'text') return node.text;
  if (node.type === 'break' || node.type === 'rule') return ' ';
  const text = node.children.map(markupText).join('');
  return node.type === 'stats' || node.type === 'bullet' ? ` ${text} ` : text;
}
