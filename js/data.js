// Game data used by the interactive tools. (The icon fields are no longer shown; they're kept for old saves and exports.)
// The rules text itself is read live from the .md files; the numbers here mirror
// equipment.md, character_creation.md, progression.md, community.md and
// exposure_and_trust.md. When a rule changes in a .md file, update it here too.

// The rules wiki: every page, in reading order, grouped. Each page is a .md file in the repo root.
export const RULE_GROUPS = [
  { id: 'start', title: 'Start here' },
  { id: 'rules', title: 'Core rules' },
  { id: 'campaign', title: 'The campaign' },
  { id: 'world', title: 'World' },
];
export const RULE_DOCS = [
  { id: 'quick_start', title: 'Quick Start', group: 'start' },
  { id: 'dice_modifiers', title: 'Dice Modifiers', group: 'start' },
  { id: 'getting_started', title: 'Getting Started', group: 'start' },
  { id: 'dice_system', title: 'Dice System', group: 'rules' },
  { id: 'character_creation', title: 'Character Creation', group: 'rules' },
  { id: 'actions', title: 'Actions', group: 'rules' },
  { id: 'equipment', title: 'Equipment & Chips', group: 'rules' },
  { id: 'progression', title: 'Progression', group: 'rules' },
  { id: 'community', title: 'Community', group: 'campaign' },
  { id: 'exposure_and_trust', title: 'Exposure & Trust', group: 'campaign' },
  { id: 'world_history', title: 'World History', group: 'world' },
];

// ---------- Glossary ----------
// Terms that can be tapped anywhere in the app. Each points at the rules section that defines it;
// the text shown comes from that .md section (or the data below for traits, talents and gear).
// anchor = the section heading with everything but letters and digits removed, lower-cased.
export const GLOSSARY = [
  { term: 'Roll', doc: 'dice_system', anchor: 'thebasics' },
  { term: 'Test', aliases: ['Tests'], doc: 'dice_system', anchor: 'thebasics' },
  { term: 'Advantage', doc: 'dice_system', anchor: 'dicepoolsadvantagedisadvantage' },
  { term: 'Disadvantage', doc: 'dice_system', anchor: 'dicepoolsadvantagedisadvantage' },
  { term: 'Net modifier', aliases: ['net dice'], doc: 'dice_modifiers', anchor: 'workingoutyourdice' },
  { term: 'Penalty cap', doc: 'dice_modifiers', anchor: 'limits' },
  { term: 'Critical', aliases: ['Criticals', 'critical'], doc: 'dice_system', anchor: 'criticalsfumbles' },
  { term: 'Fumble', aliases: ['Fumbles', 'fumble'], doc: 'dice_system', anchor: 'criticalsfumbles' },
  { term: 'Easy test', aliases: ['Easy'], doc: 'actions', anchor: 'whorolls' },
  { term: 'Hard test', aliases: ['Hard'], doc: 'actions', anchor: 'whorolls' },
  { term: 'To Hit', doc: 'dice_system', anchor: 'combatsequence' },
  { term: 'To Wound', doc: 'dice_system', anchor: 'combatsequence' },
  { term: 'Injury Table', doc: 'dice_system', anchor: 'injurytable' },
  { term: 'Free attack', doc: 'dice_system', anchor: 'injurytable' },
  { term: 'Shaken', doc: 'dice_system', anchor: 'injurytable' },
  { term: 'Wounds', aliases: ['Wound', 'wounds'], doc: 'character_creation', anchor: 'wounds' },
  { term: 'Dying', doc: 'actions', anchor: 'dying' },
  { term: 'Survival roll', aliases: ['survival roll', 'survival rolls'], doc: 'actions', anchor: 'thesurvivalroll' },
  { term: 'Scar', aliases: ['Scars'], doc: 'actions', anchor: 'scars' },
  { term: 'Healing', doc: 'actions', anchor: 'healing' },
  { term: 'Treat Wounds', doc: 'actions', anchor: 'treatwounds' },
  { term: 'Activation', doc: 'actions', anchor: 'youractivation' },
  { term: 'Move', doc: 'actions', anchor: 'youractivation' },
  { term: 'Aim', aliases: ['Aiming'], doc: 'actions', anchor: 'combatactions' },
  { term: 'Hide', doc: 'actions', anchor: 'combatactions' },
  { term: 'Stunt', aliases: ['Stunts'], doc: 'actions', anchor: 'stunts' },
  { term: 'Patch Up', doc: 'actions', anchor: 'patchup' },
  { term: 'Stabilise', aliases: ['Stabilised'], doc: 'actions', anchor: 'stabilise' },
  { term: 'Cover', doc: 'actions', anchor: 'cover' },
  { term: 'Darkness', doc: 'actions', anchor: 'darkness' },
  { term: 'Long range', doc: 'equipment', anchor: 'ranges' },
  { term: 'Downtime', doc: 'actions', anchor: 'downtime' },
  { term: 'Lying low', aliases: ['Lie low'], doc: 'actions', anchor: 'lyinglow' },
  { term: 'Trait', aliases: ['Traits'], doc: 'character_creation', anchor: 'traitsinsteadofskills' },
  { term: 'Helping', aliases: ['Helper', 'Help'], doc: 'character_creation', anchor: 'helping' },
  { term: 'Background', aliases: ['Backgrounds'], doc: 'character_creation', anchor: 'backgrounds' },
  { term: 'Marks', doc: 'progression', anchor: 'marks' },
  { term: 'Crew level', doc: 'progression', anchor: 'marks' },
  { term: 'Level', doc: 'progression', anchor: 'leveltable' },
  { term: 'Advance', aliases: ['Advances'], doc: 'progression', anchor: 'advances' },
  { term: 'Talent', aliases: ['Talents'], doc: 'progression', anchor: 'talents' },
  { term: 'Contact', aliases: ['Contacts'], doc: 'progression', anchor: 'contacts' },
  { term: 'Chips', doc: 'equipment', anchor: 'chips' },
  { term: 'Markets', aliases: ['Market'], doc: 'equipment', anchor: 'markets' },
  { term: 'Tool', aliases: ['Tools'], doc: 'equipment', anchor: 'tools' },
  { term: 'Consumable', aliases: ['Consumables'], doc: 'equipment', anchor: 'consumables' },
  { term: 'Graft', aliases: ['Grafts'], doc: 'equipment', anchor: 'refinedgrafts' },
  { term: 'Community', doc: 'community', anchor: 'thecommunitytrack' },
  { term: 'Homecoming', doc: 'community', anchor: 'homecoming' },
  { term: 'Need', doc: 'community', anchor: 'theneed' },
  { term: 'Pot', doc: 'community', anchor: 'thepotandbuilding' },
  { term: 'Hardship', aliases: ['Hardship test'], doc: 'community', anchor: 'hardship' },
  { term: 'Raid', aliases: ['Raids', 'Raid check', 'Raid test'], doc: 'community', anchor: 'raids' },
  { term: 'Project', aliases: ['Projects', 'Tier'], doc: 'community', anchor: 'projects' },
  { term: 'Exposure', doc: 'exposure_and_trust', anchor: 'exposure' },
  { term: 'Clean job', doc: 'exposure_and_trust', anchor: 'cleanjobs' },
  { term: 'Burned', doc: 'exposure_and_trust', anchor: 'burned' },
  { term: 'Trust', doc: 'exposure_and_trust', anchor: 'trust' },
  { term: 'Favour', aliases: ['Favours'], doc: 'exposure_and_trust', anchor: 'favours' },
];

// ---------- Dice counter ----------
// What the sheet's dice counter offers. Numbers mirror dice_modifiers.md.
// mode: test | hit | wound | survival. auto: worked out from the character (see characters.js).
export const DICE_MODES = [
  { id: 'test', title: 'Test' },
  { id: 'hit', title: 'To Hit' },
  { id: 'wound', title: 'To Wound' },
  { id: 'survival', title: 'Survival' },
];
export const DICE_SOURCES = {
  test: [
    { id: 'tool', label: 'Tool', n: 1, note: 'one per roll' },
    { id: 'help', label: 'Helper', n: 1, note: 'one helper' },
    { id: 'easy', label: 'Easy', n: 1, group: 'diff' },
    { id: 'hard', label: 'Hard', n: -1, group: 'diff' },
    { id: 'bribe', label: 'Bribe', n: 1 },
    { id: 'consumable', label: 'Consumable', n: 1, note: 'field dressing, strike-oil' },
    { id: 'hall3', label: 'Hall III', n: 1, note: 'once per job' },
    { id: 'conspicuous', label: 'Conspicuous gear', n: -1, note: 'sneaking or blending in' },
  ],
  hit: [
    { id: 'trait', label: 'Brawler or Marksman', n: 1 },
    { id: 'aim', label: 'Aim', n: 1 },
    { id: 'ghost', label: 'Ghost, from Hide', n: 1, talent: 'ghost' },
    { id: 'long', label: 'Long range', n: -1 },
    { id: 'cover', label: 'Cover or darkness', n: -1, note: 'ranged only' },
    { id: 'smoke', label: 'Through smoke', n: -1 },
    { id: 'floored', label: 'Floored', n: -1 },
  ],
  wound: [
    { id: 'crit', label: 'Critical hit', n: 1 },
    { id: 'ghost', label: 'Ghost, from Hide', n: 1, talent: 'ghost' },
    { id: 'overpressure', label: 'Overpressure', n: 1, talent: 'overpressure', note: 'once per combat' },
    { id: 'fireproof', label: 'Target is Fireproof', n: -1, fire: true },
  ],
  survival: [
    { id: 'satchel', label: "Medic's satchel", n: 1 },
    { id: 'dressing', label: 'Field dressing', n: 1 },
    { id: 'stabilised', label: 'Stabilised in the fight', n: 1 },
    { id: 'clinic3', label: 'Clinic III', n: 1 },
    { id: 'hardtokill', label: 'Hard to Kill (the Dying character)', n: 1 },
  ],
};

// ---------- Traits ----------
export const TRAITS = [
  { id: 'Brawler', icon: '👊', covers: 'Melee To Hit, grappling, shoving, forcing doors, holding a doorway', not: 'Shooting, threatening someone without a fight' },
  { id: 'Marksman', icon: '🎯', covers: 'Ranged To Hit, trick shots, judging distance, spotting a firing position', not: 'Melee, repairing guns (Mechanic)' },
  { id: 'Thief', icon: '🗝️', covers: 'Picking locks, pickpocketing, palming items, slipping bonds, casing a building', not: 'Sneaking past people (Shadow)' },
  { id: 'Craftsperson', icon: '🔨', covers: 'Building and repairing by hand, taking locks and mechanisms apart, appraising goods, improvising tools', not: 'Engines and boilers (Mechanic)' },
  { id: 'Mechanic', icon: '⚙️', covers: 'Boilers, engines, pressure lines, vehicle repair, sabotaging machinery, repairing guns', not: 'Driving (Driver)' },
  { id: 'Medic', icon: '🩹', covers: 'Treating wounds, survival rolls, diagnosing illness, identifying drugs and poisons', not: 'Hurting people efficiently' },
  { id: 'Smooth Talker', icon: '🗣️', covers: 'Persuading, lying, haggling, charming, talking your way past a guard', not: 'Threats (Intimidator), court manners (Courtier)' },
  { id: 'Intimidator', icon: '😠', covers: 'Threatening, interrogating, breaking a crowd\'s nerve, staring someone down', not: 'Persuading someone who isn\'t afraid of you' },
  { id: 'Streetwise', icon: '🏚️', covers: 'Finding people and goods in the Works and the Sunk, reading gang signs, hearing rumours, black-market prices', not: 'Anything in the Heights' },
  { id: 'Courtier', icon: '🎩', covers: 'Etiquette in the Terraces and Heights, passing as a servant, reading Refined tells, knowing who\'s who in the houses', not: 'Anything in the Works' },
  { id: 'Runner', icon: '🏃', covers: 'Climbing, sprinting, chases on foot, rooftop jumps, escaping', not: 'Hiding (Shadow)' },
  { id: 'Shadow', icon: '🌑', covers: 'Sneaking, hiding, tailing someone, moving unseen', not: 'Locks (Thief)' },
  { id: 'Driver', icon: '🚂', covers: 'Steam carts, barges, crawlers, vehicle chases, knowing the routes', not: 'Fixing the vehicle (Mechanic)' },
  { id: 'Forger', icon: '🖋️', covers: 'Forged documents, invitations, seals and signatures, spotting forgeries', not: 'Disguises (the handler supplies those)' },
  { id: 'Lettered', icon: '📚', covers: 'Reading and writing well, records, maps, codes, history, finding things in archives', not: 'Speaking persuasively' },
];
export const traitIcon = (t) => (TRAITS.find((x) => x.id === t) || {}).icon || '🧬';

// Talents: two per trait (trait set), plus general talents (trait null) anyone can take.
export const TALENTS = [
  { id: 'haymaker', trait: 'Brawler', name: 'Haymaker', effect: 'When your melee wound roll gives Shaken, the target gains 2 Shaken instead.' },
  { id: 'shove', trait: 'Brawler', name: 'Shove', effect: 'When you hit in melee, you can push the target 3" straight away from you instead of rolling To Wound.' },
  { id: 'deadeye', trait: 'Marksman', name: 'Dead Eye', effect: 'Aiming gives +2 dice instead of +1.' },
  { id: 'steadyhands', trait: 'Marksman', name: 'Steady Hands', effect: 'Unwieldy ranged weapons don\'t stop you Moving and Attacking in the same activation.' },
  { id: 'quickhands', trait: 'Thief', name: 'Quick Hands', effect: 'In combat, picking a lock or using an item takes your Move instead of your Action.' },
  { id: 'lightfingers', trait: 'Thief', name: 'Light Fingers', effect: 'Once per job, reveal that you lifted something earlier: a key, a pass, a purse (5c) or a Works tool.' },
  { id: 'juryrig', trait: 'Craftsperson', name: 'Jury-rig', effect: 'Once per job, improvise any Works tool from what\'s lying around. It lasts for one scene.' },
  { id: 'barricade', trait: 'Craftsperson', name: 'Barricade', effect: 'As an Action, drag together a 3" wall of junk. It gives cover until the end of combat.' },
  { id: 'overpressure', trait: 'Mechanic', name: 'Overpressure', effect: 'Once per combat, +1 dice To Wound with a firearm or boiler lance. Afterwards the DM may call it Conspicuous for the rest of the job.' },
  { id: 'saboteur', trait: 'Mechanic', name: 'Saboteur', effect: 'Once per job, a machine you\'ve had your hands on fails exactly when you choose. No test when it fails.' },
  { id: 'fieldsurgeon', trait: 'Medic', name: 'Field Surgeon', effect: 'Patch Up can remove 1 wound instead of Shaken.' },
  { id: 'triage', trait: 'Medic', name: 'Triage', effect: 'Treat Wounds takes one minute instead of ten, and you can treat each character twice per job.' },
  { id: 'silvertongue', trait: 'Smooth Talker', name: 'Silver Tongue', effect: 'Once per job, turn a failed social test into a pass. The DM names a price you must accept.' },
  { id: 'fastfriends', trait: 'Smooth Talker', name: 'Fast Friends', effect: 'Once per job, a minor character treats you as an old friend. Social tests with them are Easy.' },
  { id: 'menace', trait: 'Intimidator', name: 'Menace', effect: 'Combat Action: an enemy within 6" who can see you. Intimidator test: pass = 1 Shaken, critical = 2.' },
  { id: 'interrogator', trait: 'Intimidator', name: 'Interrogator', effect: 'A captive you question answers one question truthfully. No test.' },
  { id: 'eartotheground', trait: 'Streetwise', name: 'Ear to the Ground', effect: 'One free Informant question each job.' },
  { id: 'bargainhunter', trait: 'Streetwise', name: 'Bargain Hunter', effect: 'Once per downtime, buy one item at 20% off (rounded up). Doesn\'t stack with the Workshop.' },
  { id: 'belongshere', trait: 'Courtier', name: 'Belongs Here', effect: 'In the Terraces and Heights, the first time each job someone questions why you\'re there, they accept your answer.' },
  { id: 'gossip', trait: 'Courtier', name: 'Gossip', effect: 'Once per job, you know something embarrassing about one named upper-class person. One social test with them is Easy.' },
  { id: 'fleetfooted', trait: 'Runner', name: 'Fleet-footed', effect: 'Move 8" instead of 6".' },
  { id: 'freerunner', trait: 'Runner', name: 'Free Runner', effect: 'Climbing and jumping up to 3" during a Move never needs a test.' },
  { id: 'ghost', trait: 'Shadow', name: 'Ghost', effect: 'When you Attack from Hide, +1 dice To Hit and To Wound. Afterwards you\'re no longer hidden.' },
  { id: 'vanish', trait: 'Shadow', name: 'Vanish', effect: 'You can Hide using your Move instead of your Action.' },
  { id: 'getaway', trait: 'Driver', name: 'Getaway', effect: 'Once per job, if you\'re driving, the crew escapes a scene. No test.' },
  { id: 'shortcut', trait: 'Driver', name: 'Shortcut', effect: 'Once per job, you know a quicker route: the crew gets somewhere first, or shakes off a tail.' },
  { id: 'papertrail', trait: 'Forger', name: 'Paper Trail', effect: 'Once per job, produce a document you "made earlier". It counts as a Papers favour.' },
  { id: 'doctoredrecords', trait: 'Forger', name: 'Doctored Records', effect: 'Once per downtime, lose a report or rewrite a ledger: -1 Exposure. Doesn\'t stack with a Cleaner.' },
  { id: 'research', trait: 'Lettered', name: 'Research', effect: 'Once per job, ask the DM one question about a person, place or house. The answer is true.' },
  { id: 'blueprints', trait: 'Lettered', name: 'Blueprints', effect: 'At the start of a job, name one hidden way in, out or through the place. The DM makes it real.' },
  // General talents
  { id: 'lucky', trait: null, icon: '🍀', name: 'Lucky', effect: 'Once per job, reroll one of your own rolls. You must keep the new result.' },
  { id: 'coolhead', trait: null, icon: '🧊', name: 'Cool Head', effect: 'Once per combat, at the start of your activation, remove all your Shaken.' },
  { id: 'teamplayer', trait: null, icon: '🤝', name: 'Team Player', effect: 'You can Help a crewmate without a covering trait.' },
  { id: 'hardtokill', trait: null, icon: '🫀', name: 'Hard to Kill', effect: 'Survival rolls made for you get +1 dice.' },
  { id: 'workhorse', trait: null, icon: '🛠️', name: 'Workhorse', effect: 'You take two different downtime actions instead of one.' },
];
export const MAX_TALENTS_PER_TRAIT = 2;
export const talentById = (id) => TALENTS.find((t) => t.id === id)
  // Saves from before talents had ids stored the trait name: map it to that trait's first talent.
  || TALENTS.find((t) => t.trait === id);
export const talentIcon = (t) => t.icon || traitIcon(t.trait);

export const CONTACTS = [
  { id: 'Fence', icon: '🏷️', who: 'Moves goods with no questions', effect: 'Sell gear for ¾ price. Doesn\'t stack with the Workshop.' },
  { id: 'Sunk Dealer', icon: '✨', who: 'Trades stolen Refinement', effect: 'The Refined market opens, whatever your level.' },
  { id: 'Clinic Doctor', icon: '🩺', who: 'Owes you their life, or their licence', effect: 'One free street doctor visit (remove 2 wounds) every downtime.' },
  { id: 'Informant', icon: '🗞️', who: 'Hears everything in three districts', effect: 'One free Informant question each job.' },
  { id: 'Antioch Footman', icon: '🎩', who: 'A servant inside the Antioch household', effect: 'Once per job, a Livery escort without spending a favour.' },
  { id: 'Gang Elder', icon: '🧓', who: 'Respected in the district', effect: '+1 dice on Hardship tests.' },
];

// ---------- Equipment ----------
// market: works | specialist | refined
export const MARKETS = {
  works: { name: 'Works', icon: '🔩', level: 1 },
  specialist: { name: 'Specialist', icon: '🧨', level: 3 },
  refined: { name: 'Refined', icon: '✨', level: 6 },
};

export const ITEMS = [
  // Weapons (mod applies to To Wound)
  { id: 'knife', kind: 'weapon', name: 'Knife', mod: 1, range: 'Melee, thrown', rules: ['Concealable'], price: 5, market: 'works' },
  { id: 'firebottle', kind: 'weapon', name: 'Firebottle', mod: 1, range: 'Thrown', rules: ['Blast', 'Consumable'], price: 8, market: 'works' },
  { id: 'cosh', kind: 'weapon', name: 'Cosh, wrench, club', mod: 1, range: 'Melee', rules: [], price: 5, market: 'works' },
  { id: 'pike', kind: 'weapon', name: 'Pike hook', mod: 1, range: 'Melee', rules: ['Reach'], price: 10, market: 'works' },
  { id: 'hosepistol', kind: 'weapon', name: 'Hose pistol', mod: 1, range: 'Short', rules: ['Conspicuous'], price: 10, market: 'works' },
  { id: 'pistol', kind: 'weapon', name: 'Pistol', mod: 1, range: 'Short', rules: ['Concealable'], price: 15, market: 'works' },
  { id: 'carbine', kind: 'weapon', name: 'Carbine', mod: 1, range: 'Medium', rules: ['Conspicuous'], price: 20, market: 'works' },
  { id: 'sledge', kind: 'weapon', name: 'Sledgehammer', mod: 2, range: 'Melee', rules: ['Unwieldy', 'Conspicuous'], price: 20, market: 'works' },
  { id: 'heavyblade', kind: 'weapon', name: 'Heavy blade', mod: 2, range: 'Melee', rules: ['Conspicuous'], price: 25, market: 'works' },
  { id: 'scattergun', kind: 'weapon', name: 'Scattergun', mod: 2, range: 'Short', rules: ['Conspicuous'], price: 35, market: 'works' },
  { id: 'rifle', kind: 'weapon', name: 'Rifle', mod: 2, range: 'Long', rules: ['Unwieldy', 'Conspicuous'], price: 40, market: 'works' },
  { id: 'shockbaton', kind: 'weapon', name: 'Shock baton', mod: 1, range: 'Melee', rules: ['Shock'], price: 20, market: 'specialist' },
  { id: 'garrotte', kind: 'weapon', name: 'Garrotte', mod: 1, range: 'Melee', rules: ['Ambush', 'Silent', 'Concealable'], price: 15, market: 'specialist' },
  { id: 'crossbow', kind: 'weapon', name: 'Crossbow', mod: 1, range: 'Medium', rules: ['Silent', 'Unwieldy', 'Conspicuous'], price: 30, market: 'specialist' },
  { id: 'rivetgun', kind: 'weapon', name: 'Rivet gun', mod: 1, range: 'Short', rules: ['Pierce', 'Conspicuous'], price: 30, market: 'specialist' },
  { id: 'boilerlance', kind: 'weapon', name: 'Boiler lance', mod: 1, range: 'Short', rules: ['Fire', 'Unwieldy', 'Conspicuous'], price: 35, market: 'specialist' },
  { id: 'pressurebomb', kind: 'weapon', name: 'Pressure bomb', mod: 2, range: 'Thrown', rules: ['Blast', 'Consumable'], price: 15, market: 'specialist' },
  { id: 'needle', kind: 'weapon', name: 'Refined needle', mod: 1, range: 'Melee', rules: ['Pierce', 'Silent', 'Concealable', 'Refined'], price: 40, market: 'refined' },
  { id: 'shockglove', kind: 'weapon', name: 'Shock glove', mod: 1, range: 'Melee', rules: ['Shock', 'Silent', 'Concealable', 'Refined'], price: 70, market: 'refined' },
  { id: 'sidearm', kind: 'weapon', name: 'Refined sidearm', mod: 2, range: 'Medium', rules: ['Silent', 'Concealable', 'Refined'], price: 120, market: 'refined' },
  { id: 'glassrifle', kind: 'weapon', name: 'Glass rifle', mod: 2, range: 'Long', rules: ['Silent', 'Unwieldy', 'Refined'], price: 150, market: 'refined' },
  // Armour (mod applies to To Wound rolls against the wearer)
  { id: 'padded', kind: 'armour', name: 'Padded coat, leather, padded apron', mod: -1, rules: [], price: 15, market: 'works' },
  { id: 'plate', kind: 'armour', name: 'Plate, riot armour', mod: -2, rules: ['Conspicuous'], price: 45, market: 'works' },
  { id: 'firecloth', kind: 'armour', name: 'Fire-cloth coat', mod: -1, rules: ['Fireproof'], price: 25, market: 'specialist' },
  { id: 'hiddenvest', kind: 'armour', name: 'Hidden vest', mod: -1, rules: ['Concealable'], price: 25, market: 'specialist' },
  { id: 'silkweave', kind: 'armour', name: 'Silk-weave suit (counts as a good suit)', mod: -1, rules: ['Refined'], price: 70, market: 'refined' },
  { id: 'mendingcoat', kind: 'armour', name: 'Mending coat', mod: -1, rules: ['Mending', 'Refined'], price: 60, market: 'refined' },
  { id: 'grownmail', kind: 'armour', name: 'Grown mail', mod: -2, rules: ['Refined'], price: 160, market: 'refined' },
  // Tools (+1 dice on tests they cover; one tool per roll)
  { id: 'lockpicks', kind: 'tool', name: 'Lockpicks', helps: 'Works locks', rules: ['Concealable'], price: 10, market: 'works' },
  { id: 'toolroll', kind: 'tool', name: 'Tool roll', helps: 'Building, repairing, taking things apart', rules: [], price: 10, market: 'works' },
  { id: 'mechkit', kind: 'tool', name: "Mechanic's kit", helps: 'Engines, boilers, pressure lines, vehicles', rules: ['Conspicuous'], price: 10, market: 'works' },
  { id: 'satchel', kind: 'tool', name: "Medic's satchel", helps: 'Treating wounds, survival rolls', rules: [], price: 10, market: 'works' },
  { id: 'climbrig', kind: 'tool', name: 'Climbing rig', helps: 'Climbing, rappelling', rules: ['Conspicuous'], price: 10, market: 'works' },
  { id: 'spyglass', kind: 'tool', name: 'Spyglass', helps: 'Spotting and watching from far away', rules: ['Concealable'], price: 10, market: 'works' },
  { id: 'forgerkit', kind: 'tool', name: "Forger's kit", helps: 'Forging documents and seals', rules: ['Concealable'], price: 15, market: 'works' },
  { id: 'suit', kind: 'tool', name: 'Good suit of clothes', helps: 'Passing as respectable in the Terraces', rules: [], price: 15, market: 'works' },
  { id: 'prybar', kind: 'tool', name: 'Pry bar', helps: 'Forcing doors, crates, grates and shutters', rules: ['Conspicuous'], price: 10, market: 'works' },
  { id: 'lantern', kind: 'tool', name: 'Shutter lantern', helps: 'Searching a place, and working in the dark', rules: [], price: 10, market: 'works' },
  { id: 'listeninghorn', kind: 'tool', name: 'Listening horn', helps: 'Eavesdropping through doors and walls, cracking combination locks', rules: ['Concealable'], price: 10, market: 'works' },
  { id: 'routebook', kind: 'tool', name: 'Route book', helps: 'Finding your way and driving through the Works and the Sunk', rules: ['Concealable'], price: 10, market: 'works' },
  { id: 'disguise', kind: 'tool', name: 'Disguise kit', helps: 'Passing as a particular kind of Works person', rules: [], price: 15, market: 'works' },
  { id: 'gasmask', kind: 'tool', name: 'Gas mask', helps: 'Immune to choke gas', rules: ['Conspicuous'], price: 10, market: 'specialist' },
  { id: 'grapple', kind: 'tool', name: 'Grapple gun', helps: 'Climbing; reach a ledge up to 12" away', rules: ['Conspicuous'], price: 25, market: 'specialist' },
  { id: 'torch', kind: 'tool', name: 'Cutting torch', helps: 'Cutting bars, chains, grates and Works safes', rules: ['Conspicuous'], price: 20, market: 'specialist' },
  { id: 'whisperkey', kind: 'tool', name: 'Whisper key', helps: 'Any lock, including Refined locks', rules: ['Concealable', 'Refined'], price: 60, market: 'refined' },
  { id: 'quietcloak', kind: 'tool', name: 'Quiet-cloth cloak', helps: 'Sneaking and hiding', rules: ['Refined'], price: 50, market: 'refined' },
  { id: 'sealblanks', kind: 'tool', name: 'Seal blanks', helps: 'Forging house seals and Refined papers', rules: ['Concealable', 'Refined'], price: 40, market: 'refined' },
  // Consumables
  { id: 'dressing', kind: 'consumable', name: 'Field dressing', effect: '+1 dice on one Medic test', price: 3, market: 'works' },
  { id: 'boilerblack', kind: 'consumable', name: 'Boiler-black', effect: 'Remove 1 Shaken', price: 8, market: 'works' },
  { id: 'smoke', kind: 'consumable', name: 'Smoke canister', effect: 'Ranged To Hit through a 3" cloud at -1 dice until end of round', price: 5, market: 'works' },
  { id: 'strikeoil', kind: 'consumable', name: 'Strike-oil', effect: '+1 dice on one sabotage or fire-starting test', price: 5, market: 'works' },
  { id: 'numbing', kind: 'consumable', name: 'Numbing tincture', effect: 'Before a fight: ignore the first Shaken result you suffer in it', price: 6, market: 'works' },
  { id: 'stitchglue', kind: 'consumable', name: 'Stitch-glue', effect: 'Remove 1 wound. No test, works in combat', price: 15, market: 'specialist' },
  { id: 'chokegas', kind: 'consumable', name: 'Choke gas', effect: 'Thrown (Short), Blast. Every model hit gains 1 Shaken unless masked', price: 10, market: 'specialist' },
  { id: 'sleeping', kind: 'consumable', name: 'Sleeping draught', effect: 'In food or drink: one person sleeps for about an hour. No test if they don\'t suspect', price: 10, market: 'specialist' },
  { id: 'salve', kind: 'consumable', name: 'Mending salve', effect: 'Remove 2 wounds. No test, works in combat', price: 40, market: 'refined' },
  { id: 'quickening', kind: 'consumable', name: 'Quickening draught', effect: 'A Dying character automatically passes their survival roll', price: 80, market: 'refined' },
  { id: 'forgetme', kind: 'consumable', name: 'Forget-me draught', effect: 'A witness who drinks it before the job ends forgets the last hour: -1 Exposure', price: 30, market: 'refined' },
  // Grafts (max 2, permanent, illegal)
  { id: 'sinew', kind: 'graft', name: 'Grown sinew', effect: '+1 maximum wound (to the cap of 8)', price: 150, market: 'refined' },
  { id: 'stillhand', kind: 'graft', name: 'Still hand', effect: "Counts as lockpicks that can't be found or taken", price: 100, market: 'refined' },
  { id: 'cleareye', kind: 'graft', name: 'Clear eye', effect: "Counts as a spyglass that can't be found or taken, and works in the dark", price: 100, market: 'refined' },
  { id: 'ironlung', kind: 'graft', name: 'Iron lung', effect: 'Immune to choke gas and smoke. Hold your breath for up to an hour', price: 100, market: 'refined' },
  { id: 'secondskin', kind: 'graft', name: 'Second skin', effect: "Counts as -1 armour that can't be found or taken. With worn armour, use the better rating", price: 120, market: 'refined' },
];
export const itemById = (id) => ITEMS.find((i) => i.id === id);

export const HOMECOMING_STEPS = ['Need', 'Hardship', 'Raids', 'Water', 'Pot', 'Build', 'Split'];

export const KIND_LABEL = { weapon: 'Weapons', armour: 'Armour', tool: 'Tools', consumable: 'Consumables', graft: 'Grafts' };

export const SPECIAL_RULES = {
  Concealable: 'Can be hidden on your person. A search can still find it.',
  Conspicuous: '-1 dice to sneak, blend in or pass as respectable while carried openly. Using it on a job in the Terraces or Heights is +1 Exposure.',
  Refined: 'Draws no attention upstairs. Opens Refined locks. Illegal for Works folk: caught with it is +2 Exposure.',
  Consumable: 'Used up after one use.',
  Fire: 'No To Hit roll. Every model on a straight line up to range is hit, friend or foe, and rolls To Wound at an extra -1 dice.',
  Blast: 'One To Hit roll at a model or point. On a hit, it and every model within 2" are hit.',
  Shock: 'Non-lethal. Wounded (7–11) gives 2 Shaken instead. At -3 Shaken, or on a 12: Knocked Out.',
  Pierce: "The target's armour counts as one point lower.",
  Silent: 'Raises no alarm and adds no Exposure for noise.',
  Ambush: "Can only attack a target that hasn't noticed you: you're Hidden, or it's distracted or asleep.",
  Reach: 'Melee attacks can target models up to 2" away.',
  Unwieldy: "Can't Move and Attack in the same turn. You can use your Move to Aim.",
  Mending: 'At the end of each combat, the wearer removes 1 wound.',
  Fireproof: 'Fire attacks against the wearer are at an extra -1 dice.',
};

// ---------- Backgrounds ----------
// kit: [itemId, qty, displayName?]
export const BACKGROUNDS = [
  { id: 'Foundry Hand', icon: '🔥', who: 'You poured brass and hauled slag until your hands went hard', traits: ['Craftsperson', 'Brawler', 'Mechanic'], kit: [['cosh', 1, 'Wrench'], ['padded', 1, 'Padded apron'], ['toolroll', 1]] },
  { id: 'Line Fitter', icon: '🔧', who: 'You kept the pressure lines running, crawling through ducts and up pipe stacks', traits: ['Mechanic', 'Runner', 'Craftsperson'], kit: [['cosh', 1, 'Pipe wrench'], ['mechkit', 1], ['climbrig', 1]] },
  { id: 'Cutpurse', icon: '👛', who: 'You grew up taking what the Terraces dropped', traits: ['Thief', 'Shadow', 'Streetwise'], kit: [['knife', 1], ['lockpicks', 1], ['smoke', 2]] },
  { id: 'Enforcer', icon: '🥊', who: "You stood at the gang's door and made sure people paid", traits: ['Brawler', 'Intimidator', 'Marksman'], kit: [['cosh', 1, 'Cosh'], ['hosepistol', 1], ['padded', 1, 'Padded coat']] },
  { id: 'Clinic Hand', icon: '🩹', who: 'You kept the pump-house clinic alive on donations and stubbornness', traits: ['Medic', 'Lettered', 'Smooth Talker'], kit: [['knife', 1], ['satchel', 1], ['dressing', 3], ['boilerblack', 2]] },
  { id: 'Hauler', icon: '🚂', who: 'You drove cargo between districts and knew every checkpoint', traits: ['Driver', 'Runner', 'Streetwise'], kit: [['pistol', 1], ['padded', 1, 'Padded coat']] },
  { id: 'Fixer', icon: '🤝', who: 'You worked the Margin, finding buyers and making introductions between the upper and lower layers', traits: ['Smooth Talker', 'Forger', 'Courtier'], kit: [['pistol', 1], ['forgerkit', 1]] },
  { id: 'Fallen Servant', icon: '🎩', who: 'You served in a Terraces house until you were dismissed, and you remember everything', traits: ['Courtier', 'Lettered', 'Thief'], kit: [['knife', 1], ['lockpicks', 1], ['suit', 1]], bonusChips: 5 },
  { id: 'Deserter', icon: '🎖️', who: "You fought for another house's crew or Antioch's fleet yards, then walked away (good for defectors)", traits: ['Marksman', 'Medic', 'Intimidator'], kit: [['rifle', 1]] },
  { id: 'Sunk Smuggler', icon: '🛶', who: 'You moved stolen Refinement through the underworld', traits: ['Forger', 'Driver', 'Shadow'], kit: [['knife', 1], ['padded', 1, 'Padded coat'], ['spyglass', 1]] },
];
export const STARTING_CHIPS = 20;
export const BASE_WOUNDS = 5;
export const MAX_WOUNDS = 8;
export const MAX_TRAITS = 6;
export const MAX_CONTACTS = 3;
export const MAX_GRAFTS = 2;

export const WHY_ANTIOCH = [
  'Because the water has to keep running.',
  'Because the gang took me in when nobody else would.',
  'Because I owe someone in the gang a debt.',
  "Because one day I'll find a way out of the contract.",
];

// ---------- Progression ----------
export const MARKS_PER_LEVEL = 4;
export const MAX_LEVEL = 10;
export const levelFromMarks = (m) => Math.min(MAX_LEVEL, Math.floor(m / MARKS_PER_LEVEL) + 1);
export const marksForLevel = (l) => (l - 1) * MARKS_PER_LEVEL;
export const LEVEL_REWARDS = {
  1: 'A new character: 3 traits, 5 wounds, the Works market',
  2: 'An advance', 3: 'An advance. The Specialist market opens', 4: 'An advance. Hardened: +1 maximum wound',
  5: 'An advance', 6: 'An advance. The Refined market opens', 7: 'An advance', 8: 'An advance. Hardened: +1 maximum wound',
  9: 'An advance', 10: 'An advance. A name on the street',
};

// ---------- Jobs ----------
export const JOBS = {
  simple: { name: 'Simple', icon: '🟢', pay: 30, marks: 1, examples: 'Deliver a package, watch a building, escort a cargo' },
  standard: { name: 'Standard', icon: '🟡', pay: 60, marks: 2, examples: 'Break in, steal a ledger, sabotage a pump, plant evidence' },
  dangerous: { name: 'Dangerous', icon: '🔴', pay: 120, marks: 3, examples: "Kidnapping, a job in the Heights, crossing a rival house's crew" },
};

// ---------- Community ----------
export const PROJECTS = [
  { id: 'clinic', name: 'Clinic', icon: '🩺', tiers: ['Recovery removes 2 wounds (instead of 1)', 'Recovery removes all wounds', '+1 dice on survival rolls'] },
  { id: 'workshop', name: 'Workshop', icon: '🔧', tiers: ['Sell gear for ¾ price (not with a Fence)', 'Works market items cost 20% less', 'Specialist market opens (also 20% off)'] },
  { id: 'watch', name: 'Watch', icon: '👁️', tiers: ['+1 dice on Raid tests', '+2 dice on Raid tests', '+3 dice on Raid tests, and the crew can defend in person'] },
  { id: 'cistern', name: 'Cistern', icon: '💧', tiers: ['Each water cut: the first Homecoming without water costs nothing', 'Each water cut: the first three Homecomings cost nothing', 'The district has its own water'] },
  { id: 'safehouse', name: 'Safehouse', icon: '🏚️', tiers: ['Keep Quiet removes 2 Exposure', 'Lying low removes 3 Exposure', 'Once per campaign, when Exposure would reach 10, set it to 8'] },
  { id: 'hall', name: 'Hall', icon: '📚', tiers: ['+1 dice on Hardship tests', 'New characters join at the full crew level', 'Once per job, +1 dice on one test, no trait needed'] },
];
export const MAX_COMMUNITY = 10;
export const communityCost = (next) => next * 10;

export const COMMUNITY_BANDS = [
  { min: 0, max: 0, name: 'Collapsed', icon: '💀', need: 0, text: 'Families scatter. No Need, no Hardship, no project benefits.' },
  { min: 1, max: 2, name: 'Desperate', icon: '🥀', need: 5, text: 'Empty shopfronts. People leaving for other gangs.' },
  { min: 3, max: 4, name: 'Struggling', icon: '🧱', need: 10, text: 'Getting by on what the crew sends. One bad month from Desperate.' },
  { min: 5, max: 6, name: 'Getting By', icon: '🔧', need: 15, text: 'Repairs get done. Kids go to the Hall instead of the street.' },
  { min: 7, max: 8, name: 'Thriving', icon: '🌱', need: 20, text: 'Other districts notice. Some of them are jealous.' },
  { min: 9, max: 10, name: 'Flourishing', icon: '🏙️', need: 25, text: 'A power in the Works. The houses start to notice too.' },
];
export const communityBand = (c) => COMMUNITY_BANDS.find((b) => c >= b.min && c <= b.max);

export const HARDSHIP_EVENTS = [
  { roll: 1, name: 'Sickness', icon: '🤒', text: 'Something goes through the district. If the Clinic has any tiers, the lost tier must be a Clinic tier.' },
  { roll: 2, name: 'Families leave', icon: '🚪', text: "They go to a rival gang's district. Make a Raid check this Homecoming, even if one isn't due." },
  { roll: 3, name: 'Debt', icon: '💰', text: 'A Sunk lender covers the shortfall. At the next Homecoming (only), the Need is doubled.' },
  { roll: 4, name: 'Unrest', icon: '🔥', text: 'Arguments, then fighting. The ration board burns. If the Watch or Hall has any tiers, the lost tier must be one of them.' },
  { roll: 5, name: 'Close to home', icon: '🫂', text: "Someone from a crew member's Ties is hurt, ill or in trouble. The DM turns it into a personal side job." },
  { roll: 6, name: 'Pressure drop', icon: '💧', text: 'The pump house fails. Pay 15c now (from the pay, the Pot or anyone\'s chips), or lose 1 more tier.' },
];

// ---------- Exposure & Trust ----------
export const EXPOSURE_EVENTS = [
  { icon: '👀', text: 'Seen by a witness', n: 1 },
  { icon: '🚨', text: 'Alarm raised', n: 1 },
  { icon: '📢', text: 'Conspicuous gear upstairs', n: 1 },
  { icon: '🩸', text: 'Body / evidence left', n: 1 },
  { icon: '💸', text: 'Failed Heights bribe', n: 1 },
  { icon: '🪪', text: 'Identified / linked to Antioch', n: 2 },
  { icon: '✨', text: 'Caught with Refined gear', n: 2 },
  { icon: '🏃', text: "Rival house's crew got away", n: 2 },
];
export const EXPOSURE_BANDS = [
  { min: 0, max: 3, name: 'Quiet', icon: '🟢', text: 'No effect.' },
  { min: 4, max: 6, name: 'Noticed', icon: '🟡', text: 'Rivals know who the crew works for. Raid check at every Homecoming.' },
  { min: 7, max: 9, name: 'Hot', icon: '🟠', text: 'Raid checks at +1 dice, Raid tests at -1 dice. Job pay -10c. One fewer favour.' },
  { min: 10, max: 10, name: 'Burned', icon: '🔴', text: 'No jobs, no favours, no protection. The water may be cut. Trust -2.' },
];
export const exposureBand = (e) => EXPOSURE_BANDS.find((b) => e >= b.min && e <= b.max);

export const TRUST_EVENTS = [
  { icon: '✅', text: 'Objective completed', n: 1 },
  { icon: '✨', text: 'Clean job', n: 1 },
  { icon: '🗞️', text: 'Brought something useful', n: 1 },
  { icon: '❌', text: 'Objective failed', n: -1 },
  { icon: '🧥', text: 'Loaned item lost', n: -1 },
  { icon: '🙅', text: 'Disobeyed, caused trouble', n: -1 },
  { icon: '🤥', text: 'Caught lying', n: -2 },
  { icon: '🏛️', text: 'Worked for another house', n: -3 },
];
export const TRUST_BANDS = [
  { min: 0, max: 2, name: 'Cold', icon: '🧊', favours: 0, text: 'The DM leaves one important detail out of every briefing.' },
  { min: 3, max: 5, name: 'Working', icon: '🤝', favours: 1, text: 'Does the job, and nothing more.' },
  { min: 6, max: 8, name: 'Trusted', icon: '🫱', favours: 2, text: 'Will lend Refined gear.' },
  { min: 9, max: 10, name: 'Confidant', icon: '🗝️', favours: 3, text: 'Once per campaign, takes the blame for a disaster: -3 Exposure.' },
];
export const trustBand = (t) => TRUST_BANDS.find((b) => t >= b.min && t <= b.max);

export const FAVOURS = [
  { icon: '🧥', name: 'Loan', text: 'Borrow one item for the job. Refined needs Trust 6+. Return it, or -1 Trust.' },
  { icon: '📜', name: 'Papers', text: 'Counts as a tool (+1 dice) to pass as someone who belongs.' },
  { icon: '🚪', name: 'Livery escort', text: 'Through one upper gate or checkpoint. No test.' },
  { icon: '🗞️', name: 'Intel', text: 'Ask the DM one question about the job. The answer is true.' },
  { icon: '🧹', name: 'Clean-up', text: '-1 Exposure after the job.' },
  { icon: '🚨', name: 'Extraction (2 favours)', text: 'Once, get out of one bad situation.' },
];
