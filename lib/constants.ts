import { Character } from "./types"

export const CHARACTERS: Character[] = [
  {
    name: "Warrior",
    emoji: "⚔️",
    color: "bg-red-500",
    boardAbility: { name: "Charge", description: "Move 2 extra tiles once per turn", uses: 1, maxUses: 1 },
    combatAbility: { name: "Berserker Rage", description: "Deal +4 damage for one attack", uses: 2, maxUses: 2 },
  },
  {
    name: "Mage",
    emoji: "🧙‍♂️",
    color: "bg-blue-500",
    boardAbility: { name: "Teleport", description: "Move to any empty tile", uses: 1, maxUses: 1 },
    combatAbility: { name: "Magic Missile", description: "Guaranteed 8 damage (no dice)", uses: 1, maxUses: 1 },
  },
  {
    name: "Archer",
    emoji: "🏹",
    color: "bg-green-500",
    boardAbility: { name: "Eagle Eye", description: "See all monster positions", uses: 3, maxUses: 3 },
    combatAbility: { name: "Precise Shot", description: "Always roll maximum on dice", uses: 1, maxUses: 1 },
  },
  {
    name: "Rogue",
    emoji: "🗡️",
    color: "bg-purple-500",
    boardAbility: { name: "Stealth", description: "Move through other players", uses: 2, maxUses: 2 },
    combatAbility: { name: "Backstab", description: "Attack first and deal +3 damage", uses: 2, maxUses: 2 },
  },
  {
    name: "Paladin",
    emoji: "🛡️",
    color: "bg-yellow-500",
    boardAbility: { name: "Divine Protection", description: "Heal 20 HP", uses: 2, maxUses: 2 },
    combatAbility: { name: "Holy Strike", description: "Deal damage equal to missing health", uses: 1, maxUses: 1 },
  },
  {
    name: "Druid",
    emoji: "🌿",
    color: "bg-emerald-500",
    boardAbility: { name: "Nature's Path", description: "Move through obstacles", uses: 3, maxUses: 3 },
    combatAbility: { name: "Wild Shape", description: "Take half damage for 3 rounds", uses: 1, maxUses: 1 },
  },
]

export const MONSTERS = ["🐉", "👹", "🧟", "🕷️", "🐺", "🦇", "👻", "🐍"]

export const MAGICAL_ITEMS = [
  "⚔️ Magic Sword (+2 attack)",
  "🛡️ Shield of Protection (+2 defense)",
  "💎 Health Potion (restore 30 HP)",
  "🔮 Crystal of Power (+1 to all rolls)",
  "🏹 Enchanted Bow (+2 attack)",
  "🧪 Strength Elixir (+3 attack for one combat)",
  "🌟 Lucky Charm (reroll once per combat)",
  "🗡️ Blade of Swiftness (attack first in combat)",
]

export const BOARD_SIZE = 15
