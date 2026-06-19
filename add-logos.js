import fs from 'fs';

const logos = {
  "LOUD": "https://i.ibb.co/xSP7G5n7/LOUD.png",
  "LYON": "https://i.ibb.co/KcSDj7Kd/LYON.png",
  "MIA CORP": "https://i.ibb.co/67N04Kgf/MIA-CORP.png",
  "PARADOX": "https://i.ibb.co/ZtFdnTg/PARADOX.png",
  "RRQ": "https://i.ibb.co/BH4Gq6PV/RRQ.png",
  "S8UL": "https://i.ibb.co/twm80GrL/S8UL.png",
  "STRAW HATS": "https://i.ibb.co/qLBXF24y/STRAW-HATS.png",
  "TITAN ESPORTS": "https://i.ibb.co/wFZjb2X2/Titan-Esports.png",
  "TOTAL GAMING": "https://i.ibb.co/PG8MhzLn/TOTAL-GAMING.png",
  "TWISTED MINDS": "https://i.ibb.co/1YGYfNHd/TWISTED.png",
  "VITALITY": "https://i.ibb.co/8L2yWqKz/VITALITY.png",
  "WAG": "https://i.ibb.co/n8MZ65Yd/WAG.png",
  "AG": "https://i.ibb.co/W4LmQJNN/AG.png",
  "AL AHLI": "https://i.ibb.co/KdYbv5w/AL-AH4LI.png",
  "APEX": "https://i.ibb.co/TB4wrtzP/APEX.png",
  "AURORA": "https://i.ibb.co/gbGFcNC7/AURORA.png",
  "BURIRAM": "https://i.ibb.co/0pH6fnK2/BURIRAM.png",
  "DEMONS PRIDE": "https://i.ibb.co/FkWq231S/DEMONS-PRIDE.png",
  "DRS": "https://i.ibb.co/Ck55FpF/DRS.png",
  "EVOS": "https://i.ibb.co/67FKcJ98/EVOS.png",
  "FALCONS": "https://i.ibb.co/FbnZ6d4N/FALCONS.png",
  "FLUXO": "https://i.ibb.co/4n3NFY6Q/FLUXO.png",
  "GUNDINASTY": "https://i.ibb.co/b5dWwm34/Gun-Dynasty.png",
  "LOSMIBR": "https://i.ibb.co/Mm2K8CB/LOSMIBR.png"
};

let content = fs.readFileSync('src/data/mockTeams.ts', 'utf-8');

// Match names like `name: "EVOS Divine",`
for (const [key, url] of Object.entries(logos)) {
  // Let's find the initials or name that maps best to key.
  // EVOS Divine -> EVOS
  // LOUD -> LOUD
  // WAG Esports -> WAG
  // All Gamers -> AG
  // Twisted Minds -> TWISTED MINDS
  // Aurora Gaming -> AURORA
  // Buriram United -> BURIRAM
  // RRQ Kazu -> RRQ
  // Team Vitality -> VITALITY
  // Team Falcons -> FALCONS
  // LOS / MIBR -> LOSMIBR
  // Fluxo -> FLUXO
  // APEX -> APEX
  // S8UL -> S8UL
  // Lyon Esports -> LYON
  // Gundinasty -> GUNDINASTY
  // Straw Hats -> STRAW HATS
  // Titan Esports -> TITAN ESPORTS
  // DRS Gaming -> DRS
  // Total Gaming -> TOTAL GAMING
  // Demons Pride -> DEMONS PRIDE
  // AL AHLI -> AL AHLI
  // MIA Corp -> MIA CORP
  // Paradox Esports -> PARADOX

  const regexMap = {
    "EVOS": "EVOS Divine",
    "LOUD": "LOUD",
    "WAG": "WAG Esports",
    "AG": "All Gamers",
    "TWISTED MINDS": "Twisted Minds",
    "AURORA": "Aurora Gaming",
    "BURIRAM": "Buriram United",
    "RRQ": "RRQ Kazu",
    "VITALITY": "Team Vitality",
    "FALCONS": "Team Falcons",
    "LOSMIBR": "LOS / MIBR",
    "FLUXO": "Fluxo",
    "APEX": "APEX",
    "S8UL": "S8UL",
    "LYON": "Lyon Esports",
    "GUNDINASTY": "Gundinasty",
    "STRAW HATS": "Straw Hats",
    "TITAN ESPORTS": "Titan Esports",
    "DRS": "DRS Gaming",
    "TOTAL GAMING": "Total Gaming",
    "DEMONS PRIDE": "Demons Pride",
    "AL AHLI": "AL AHLI",
    "MIA CORP": "MIA Corp",
    "PARADOX": "Paradox Esports"
  };

  const actualName = regexMap[key];
  if (actualName) {
    const rx = new RegExp(`(name:\\s*"${actualName}",[\\s\\S]*?initials:\\s*"[^"]*",)\\s*`, 'g');
    content = content.replace(rx, `$1\n        logoUrl: "${url}",\n        `);
  }
}

fs.writeFileSync('src/data/mockTeams.ts', content, 'utf-8');
