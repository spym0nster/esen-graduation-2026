export type ZoneKey = "BIS" | "BI" | "EB" | "M2" | "MDS" | "ESEN" | "Laur" | "Admin" | "Invite" | "EMPTY";

export const zoneConfig: Record<ZoneKey, {
  label: string;
  labelFr: string;
  color: string;
  border: string;
  glow: string;
  text: string;
}> = {
  BIS:   { label:"Business Information System", labelFr:"Business Information System", color:"rgba(27,58,140,0.80)", border:"#2E55B8", glow:"rgba(27,58,140,0.45)", text:"#FFFFFF" },
  BI:    { label:"Business Intelligence",            labelFr:"Business Intelligence",            color:"rgba(15,37,96,0.80)",   border:"#1B3A8C", glow:"rgba(15,37,96,0.45)",   text:"#FFFFFF" },
  EB:    { label:"E-Business",                       labelFr:"E-Business",                       color:"rgba(0,140,180,0.75)",  border:"#00A8CC", glow:"rgba(0,168,204,0.40)",  text:"#FFFFFF" },
  M2:    { label:"Master 2",                         labelFr:"Master 2",                         color:"rgba(0,100,160,0.75)",  border:"#0078B8", glow:"rgba(0,120,184,0.40)",  text:"#FFFFFF" },
  MDS:   { label:"E-Marketing & Digital Strategies",    labelFr:"E-Marketing et Digital Strategies",color:"rgba(240,180,41,0.85)", border:"#F0B429", glow:"rgba(240,180,41,0.45)", text:"#0F2560" },
  ESEN:  { label:"ESEN General",                     labelFr:"ESEN Général",                     color:"rgba(46,85,184,0.65)",  border:"#2E55B8", glow:"rgba(46,85,184,0.35)",  text:"#FFFFFF" },
  Laur:  { label:"Laureates",                        labelFr:"Lauréats",                         color:"rgba(200,160,20,0.60)", border:"#C9A014", glow:"rgba(200,160,20,0.35)", text:"#FFFFFF" },
  Admin: { label:"Faculty / Staff",                  labelFr:"Professeurs / Administration",      color:"rgba(155,111,191,0.38)", border:"#9B6FBF", glow:"rgba(155,111,191,0.45)", text:"#FFFFFF" },
  Invite:{ label:"Guests",                           labelFr:"Invités",                           color:"rgba(255,255,255,0.04)", border:"rgba(255,255,255,0.10)", glow:"transparent", text:"#F5ECD7" },
  EMPTY: { label:"",                                 labelFr:"",                                 color:"transparent",           border:"transparent",           glow:"transparent",           text:"transparent" },
};

// Helper to build a right-zone row of 16 seats (4 zones × 4 seats)
const makeZoneRow = (z1: ZoneKey, z2: ZoneKey, z3: ZoneKey, z4: ZoneKey): ZoneKey[] =>
  [...Array(4).fill(z1), ...Array(4).fill(z2), ...Array(4).fill(z3), ...Array(4).fill(z4)];

const adminRow = (): ZoneKey[] => Array(14).fill("Admin") as ZoneKey[];
const inviteRow = (): ZoneKey[] => Array(14).fill("Invite") as ZoneKey[];

export const seatingGrid: ZoneKey[][] = [
  // Rows 1–3: Admin left + BIS|BI|EB|M2 right
  ...Array(3).fill(null).map(() => [
    ...adminRow(), ...makeZoneRow("BIS","BI","EB","M2")
  ]),
  // Rows 4–16: Invite left + BIS|BI|EB|M2 right
  ...Array(13).fill(null).map(() => [
    ...inviteRow(), ...makeZoneRow("BIS","BI","EB","M2")
  ]),
  // Rows 17–18: Invite left + Laur across all 16
  ...Array(2).fill(null).map(() => [
    ...inviteRow(), ...Array(16).fill("Laur") as ZoneKey[]
  ]),
  // Row 19: Invite left + MDS across all 16
  [...inviteRow(), ...Array(16).fill("MDS") as ZoneKey[]],
  // Rows 20–27: Invite left + ESEN across all 16
  ...Array(8).fill(null).map(() => [
    ...inviteRow(), ...Array(16).fill("ESEN") as ZoneKey[]
  ]),
];

export const LEFT_COLS = 14;
