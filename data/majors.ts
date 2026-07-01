export interface MajorCard {
  id: number;
  name: string;
  specialty: string;
  imageUrl?: string;
  score?: string;
}

// Licence — 8 cards (2 per specialty)
export const licenceMajors: MajorCard[] = [
  { id: 1, name: "Bilel Triki", specialty: "L3 BI", score: "17.6 / 20", imageUrl: "/images/committee/bilel triki.webp" },
  { id: 2, name: "Mehdi Mzari", specialty: "L3 BI", score: "16.99 / 20", imageUrl: "/images/majors/mahdi mzari.png" },
  { id: 3, name: "Mariem Kaffela", specialty: "L3 BIS", score: "17.1 / 20", imageUrl: "/images/majors/meriem kaffela.webp" },
  { id: 4, name: "Moudhafer Maatoug", specialty: "L3 BIS", score: "16.5 / 20", imageUrl: "/images/majors/moudhafer maatoug.jpg" },
  { id: 5, name: "Yasmine Belghalmi", specialty: "L3 EBUS", score: "15.82 / 20", imageUrl: "/images/majors/Yasmine Belghalmi.webp" },
  { id: 6, name: "Souha Bouzidi", specialty: "L3 EBUS", score: "15.64 / 20", imageUrl: "/images/majors/BOUZIDI SOUHA.jpg" },
  { id: 7, name: "Meriem Khemissi", specialty: "L3 E-MDS", score: "16.76 / 20" },
  { id: 8, name: "Hajer El Arbi", specialty: "L3 E-MDS", score: "16.72 / 20" },
];

// Master — 12 cards (2 per specialty)
export const masterMajors: MajorCard[] = [
  { id: 101, name: "À venir", specialty: "M2 DSSD" },
  { id: 102, name: "À venir", specialty: "M2 DSSD" },
  { id: 103, name: "À venir", specialty: "M2 EBUS" },
  { id: 104, name: "À venir", specialty: "M2 EBUS" },
  { id: 105, name: "À venir", specialty: "M2 WI" },
  { id: 106, name: "À venir", specialty: "M2 WI" },
  { id: 107, name: "À venir", specialty: "M2 EBUS (en ligne)" },
  { id: 108, name: "À venir", specialty: "M2 EBUS (en ligne)" },
  { id: 109, name: "À venir", specialty: "M2 VIC" },
  { id: 110, name: "À venir", specialty: "M2 VIC" },
  { id: 111, name: "À venir", specialty: "M2 CGBI" },
  { id: 112, name: "À venir", specialty: "M2 CGBI" },
];
