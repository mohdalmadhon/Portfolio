export interface PixelIconDef {
  rows: string[]
  palette: Record<string, string>
}

export const ICONS: Record<string, PixelIconDef> = {
  face: {
    rows: ['HHHHHHHH', 'HSSHHHHH', 'SSLSHHHH', 'SSSSSSHH', 'SWISSIWS', 'MMMSSMMM', 'BBmmmmBB', 'BBBBBBBB'],
    palette: { H: '#7b3d1b', S: '#eda57f', L: '#f6c39d', W: '#f3f1f4', I: '#5a3ea6', M: '#a3491f', B: '#93401b', m: '#552a17' },
  },
  diamond: {
    rows: ['................', '................', '.....aaaaaa.....', '....abccccba....', '...abacbbbbba...', '..acbcbbbbbbba..', '.abbbbbbbbbbbba.', '..abbbbbbbbbda..', '...abbbbbbbda...', '....abbbbbda....', '.....abbbda.....', '......abda......', '.......aa.......', '................', '................', '................'],
    palette: { a: '#0b3a37', b: '#5ff2e4', c: '#d4fffb', d: '#1f9e96' },
  },
  emerald: {
    rows: ['................', '......aaaa......', '.....abbbca.....', '....abccccca....', '...abccccccca...', '...abccccccda...', '...abccccccda...', '...abccccccda...', '...abccccccda...', '...abccccccda...', '...acccccccda...', '....acccccda....', '.....acddda.....', '......aaaa......', '................', '................'],
    palette: { a: '#073b1e', b: '#c4ffdc', c: '#2fdc7a', d: '#138a47' },
  },
  pickaxe: {
    rows: ['................', '.....aaaaaa.....', '....abbbbbcaa...', '...abddddddcca..', '..abdaaaaaeacca.', '..aca....efgaca.', '...a....efheaca.', '.......efhe..a..', '......efhe......', '.....efhe.......', '....efhe........', '...efhe.........', '..efhe..........', '.eghe...........', '..ee............', '................'],
    palette: { a: '#0b3a37', b: '#d4fffb', c: '#5ff2e4', d: '#1f9e96', e: '#2e1c0b', f: '#b98a4e', g: '#8a5a2b', h: '#5a3818' },
  },
  sword: {
    rows: ['................', '.............aa.', '............abca', '...........abda.', '..........abda..', '.........abda...', '........abda....', '...e...abda.....', '..efe.abda......', '...efabda.......', '....efca........', '...ghife........', '..ghjgefe.......', '.gijg..e........', '..gg............', '................'],
    palette: { a: '#2b2b2b', b: '#ffffff', c: '#d6d6d6', d: '#8c8c8c', e: '#2e1c0b', f: '#8a5a2b', g: '#3a2510', h: '#d9b37a', i: '#b0844a', j: '#7a5528' },
  },
  compass: {
    rows: ['.......aa.......', '....aaabcaaa....', '...abbcddcbca...', '..abcdeeefcdca..', '.abcdefffffgbca.', '.abdeffffhgfcda.', '.acefffffhgefca.', 'abdeffffhgefhbca', 'acdefffhceffhbda', '.acfffhiefffhca.', '.abcfhiefffhbda.', '.acccfieffhbcda.', '..acdifhhhbcda..', '...acccbbcdda...', '....aaacdaaa....', '.......aa.......'],
    palette: { a: '#2b2b2b', b: '#ffffff', c: '#d6d6d6', d: '#8c8c8c', e: '#f0f0ff', f: '#c9cde0', g: '#d0302a', h: '#8a8fa8', i: '#2a2a2a' },
  },
  clock: {
    rows: ['.......aa.......', '....aaabcaaa....', '...abbcddcbca...', '..abcdeeffccca..', '.abcdefghefccca.', '.abdefffefffcda.', '.acefffggffffca.', 'abdegggbcfgggbca', 'acdfiijcdiiijbda', '.acfijjiijjjkca.', '.abcijjjjjjjkca.', '.acdijjjjjjjkca.', '..acjkkkkkkkka..', '...acccbbccca...', '....aaacdaaa....', '.......aa.......'],
    palette: { a: '#5a3e05', b: '#fff3a6', c: '#f5c84c', d: '#b5850f', e: '#7fd6ff', f: '#3d93d8', g: '#1f5a99', h: '#2a2a2a', i: '#ffffff', j: '#ffe27a', k: '#e0a21a' },
  },
  map: {
    rows: ['................', '................', '..aaaaaaaaaaaa..', '.abbbbbbbbbbbca.', '.abcdddcccddcda.', '.abdeeebcdffbda.', '.abdeeebcdffbda.', '.abdeeecdgbbcda.', '.abcbbcggcddcda.', '.abccdgbchhhbda.', '.abcdgbcdhhhbda.', '.abccbccdhhhbda.', '.abccccccbbbcda.', '.acddddddddddda.', '..aaaaaaaaaaaa..', '................'],
    palette: { a: '#4a4232', b: '#ffffff', c: '#efe7d6', d: '#c4b99f', e: '#5fae3a', f: '#d0302a', g: '#b0844a', h: '#3d93d8' },
  },
  book: {
    rows: ['................', '...aaaaaaaaaa...', '..abbbbbbbbcca..', '..abccccccdeefg.', '..abcddddddefhg.', '..abdiiiiicefhg.', '..abdiiiiicefhg.', '..abcbbbbbdefhg.', '..abccccccdefhg.', '..abccccccdefhg.', '..abccccccdefhg.', '..abccccccdefhg.', '..abccccccdefhg.', '..acdddddddfhhg.', '...aaaaaaaaggg..', '................'],
    palette: { a: '#2e0b08', b: '#c4614a', c: '#93322a', d: '#5c1712', e: '#ffffff', f: '#efe7d6', g: '#4a4232', h: '#c4b99f', i: '#f5c84c' },
  },
  envelope: {
    rows: ['................', '................', '................', '..abbbbbbbbbba..', '.acdeeeeeeeedca.', '.bdcdfddddffcdb.', '.bedccdfffccefb.', '.bededcggceedfb.', '.beddddggedddfb.', '.bedddfggedddfb.', '.beddddeeddddfb.', '.beddddddddddfb.', '.bdfffffffffffb.', '..bbbbbbbbbbbb..', '................', '................'],
    palette: { a: '#3b392f', b: '#4a4232', c: '#e3dfd0', d: '#efe7d6', e: '#ffffff', f: '#c4b99f', g: '#d0302a' },
  },
  star: {
    rows: ['.......aa.......', '......abca......', '......abda......', '.....abccca.....', '.aaaaabccdaaaaa.', 'accbbbccccbbbcca', '.aacccccccccdaa.', '...acccccccda...', '....abccccda....', '...abccddccca...', '...abcdaaccda...', '..abcda..accca..', '.acdda....acdca.', '..aaa......aaa..', '................', '................'],
    palette: { a: '#5a3e05', b: '#ffffff', c: '#ffe27a', d: '#e0a21a' },
  },
  quote: {
    rows: ['................', '.aaaaaaaaaaaaaa.', 'abbbbbbbbbbbbbca', 'abcdddddddddccda', 'abdeeeeeeeeebcda', 'abccccccccbbccda', 'abdeeeeeeebcccda', 'abcbbbbbbbccccda', 'abccccccccccccda', 'acddddddddddddda', '.aaaaafeefaaaaa.', '......feef......', '......feef......', '......feef......', '......feef......', '.......ff.......'],
    palette: { a: '#3a2510', b: '#d9b37a', c: '#b0844a', d: '#7a5528', e: '#8a5a2b', f: '#2e1c0b' },
  },
  skull: {
    rows: ['................', '...aaaaaaaaaa...', '..abbbbbbbbbca..', '..abccccccccda..', '..abccccccccda..', '..abdddccdddda..', '..aceeebdeeeca..', '..aceeebdeeeca..', '..aceeecdeeeca..', '..abbbceebbbda..', '..abccdeebccda..', '..acddccbdcdda..', '...afecececaa...', '....acdcdcda....', '.....aaaaaa.....', '................'],
    palette: { a: '#3b392f', b: '#ffffff', c: '#e3dfd0', d: '#a8a491', e: '#2a2a2a', f: '#000000' },
  },
  sun: {
    rows: ['.......a........', '......aba.......', '...a...a....a...', '..aba.aaaa.aba..', '...a.acccba.a...', '....acbbbbba....', '...acbbbbbbba...', '.a.acbbbbbbda.a.', 'abaacbbbbbbdaaba', '.a.abbbbbbbda.a.', '....abbbbbda....', '...a.abddda.a...', '..aba.aaaa.aba..', '...a....a...a...', '.......aba......', '........a.......'],
    palette: { a: '#5a3e05', b: '#ffe27a', c: '#ffffff', d: '#e0a21a' },
  },
  moon: {
    rows: ['................', '.......a........', '.....aaba.......', '....acba........', '...acda.........', '..acbda.........', '..acbda.........', '.acbbda.........', '.abbbda.........', '..acdeba........', '..abbcbbaaaa....', '...abbdecccba...', '....abdcbdda....', '.....aabdaa.....', '.......aa.......', '................'],
    palette: { a: '#2f3242', b: '#c9cde0', c: '#f0f0ff', d: '#8a8fa8', e: '#d6d6d6' },
  },
  code: {
    rows: ['................', '..aaaaaaaaaaaa..', '.abbbbbbbbbbbca.', '.abccccccccccda.', '.abcdccccccccda.', '.abdeccccccccda.', '.abccecccccccda.', '.abcccebcccccda.', '.abcdebccccccda.', '.abdebccddddcda.', '.abcbccdeeeebda.', '.abcccccbbbbcda.', '.abccccccccccda.', '.acddddddddddda.', '..aaaaaaaaaaaa..', '................'],
    palette: { a: '#000000', b: '#3a3a3a', c: '#2a2a2a', d: '#151515', e: '#5fae3a' },
  },
  gear: {
    rows: ['.....kk.....', '..k.kggk.k..', '.kgkggggkgk.', '..kggggggk..', '.kgggkkgggk.', 'kkggk..kggkk', 'kkggk..kggkk', '.kgggkkgggk.', '..kggggggk..', '.kgkggggkgk.', '..k.kggk.k..', '.....kk.....'],
    palette: { k: '#2a2a2a', g: '#c9c9cf' },
  },
  chevron: {
    rows: ['............', '.g........g.', '.gg......gg.', '..gg....gg..', '...gg..gg...', '....gggg....', '.....gg.....', '............'],
    palette: { g: '#f2eee7' },
  },
  fork: {
    rows: ['.gg.....gg..', '.gg.....gg..', '.gg.....gg..', '..gg...gg...', '...gg.gg....', '....ggg.....', '.....gg.....', '.....gg.....', '.....gg.....', '....gggg....'],
    palette: { g: '#b7b0c6' },
  },
  link: {
    rows: ['............', '......kkkk..', '.....k....k.', '.....k....k.', '...kkkk..k..', '..k..k..k...', '.k..k..k....', '.k....k.....', '..kkkk......', '............'],
    palette: { k: '#5ff2e4' },
  },
}

ICONS.chart = ICONS.clock

export const BLOCK_ICONS: Record<string, { top: string; left: string; right: string }> = {
  home: { top: 'grassTop', left: 'grassSide', right: 'grassSide' },
  grass: { top: 'grassTop', left: 'grassSide', right: 'grassSide' },
  crafting: { top: 'craftTop', left: 'craftSide', right: 'craftSide' },
  chest: { top: 'chestTop', left: 'chestFront', right: 'chestSide' },
  bookshelf: { top: 'planks', left: 'bookshelf', right: 'bookshelf' },
  furnace: { top: 'cobble', left: 'furnaceFront', right: 'cobble' },
  sculk: { top: 'sculk', left: 'sculk', right: 'sculk' },
  deepslate: { top: 'deepslateTiles', left: 'deepslateBricks', right: 'deepslateBricks' },
  diamondBlock: { top: 'diamondBlock', left: 'diamondBlock', right: 'diamondBlock' },
}
