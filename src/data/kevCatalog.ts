export type KevType =
  | "cool"
  | "sexy"
  | "dental"
  | "jokey"
  | "musical"
  | "regular";

export type KevOption = {
  id: KevType;
  name: string;
  emoji: string;
  description: string;
  image: string;
};

export type ActivityOption = {
  id: string;
  name: string;
  emoji: string;
  description: string;
};

export type ExtraOption = {
  id: string;
  name: string;
  emoji: string;
  priceLabel?: string;
};

export const kevOptions: KevOption[] = [
  {
    id: "cool",
    name: "Cool Kev",
    emoji: "😎",
    description:
      "Sunglasses may remain on indoors.",
    image: "/images/kev/cool-kev.png",
  },
  {
    id: "sexy",
    name: "Sexy Kev",
    emoji: "🔥",
    description:
      "NOT. THAT. INNOCENT. 😈",
    image: "/images/kev/sexy-kev.png",
  },
  {
    id: "dental",
    name: "Dental Kev",
    emoji: "🦷",
    description:
      "Confident smile and zero dental qualifications",
    image: "/images/kev/dental-kev.png",
  },
  {
    id: "jokey",
    name: "Jokey Kev",
    emoji: "😂",
    description:
      "Playful with lots of wordplay... too much wordplay 😅",
    image: "/images/kev/jokey-kev.jpeg",
  },
  {
    id: "musical",
    name: "Musical Kev",
    emoji: "🎵",
    description:
      "Dance or sing or guitar or balalaika or all 4!",
    image: "/images/kev/musical-kev.png",
  },
  {
    id: "regular",
    name: "Regular Kev",
    emoji: "❤️",
    description:
      "Belongs to Alexandra every day",
    image: "/images/kev/regular-kev.jpeg",
  },
];

export const activities: ActivityOption[] = [
  {
    id: "cuddle",
    name: "Cuddle",
    emoji: "🫂",
    description: "The best cuddling.",
  },
  {
    id: "movie",
    name: "Movie Night",
    emoji: "🍿",
    description: "Close together and easily distracted.",
  },
  {
    id: "coffee",
    name: "Cafe Date",
    emoji: "☕",
    description: "Hot Drinks, conversation, and hand holding.",
  },
  {
    id: "walk",
    name: "Walk Somewhere Pretty",
    emoji: "🌲",
    description: "Holding hands and enjoying views",
  },
  {
    id: "dinner",
    name: "Dinner Together",
    emoji: "🍝",
    description: "We can make something delicious!",
  },
  {
    id: "game",
    name: "Play Something",
    emoji: "🎮",
    description: "Pick any game... I hear there's a pretty good one on the homepage",
  },
  {
    id: "adventure",
    name: "Go Somewhere New",
    emoji: "🗺️",
    description: "Исследуем!",
  },
  {
    id: "nothing",
    name: "Absolutely Nothing",
    emoji: "❤️",
    description: "No plans. Just us.",
  },
];

export const extras: ExtraOption[] = [
  {
    id: "kisses",
    name: "Unlimited Kisses",
    emoji: "💋",
    priceLabel: "FREE",
  },
  {
    id: "forehead-kisses",
    name: "Forehead Kisses",
    emoji: "😘",
    priceLabel: "FREE",
  },
  {
    id: "cuddles",
    name: "Extra Cuddles",
    emoji: "🫂",
    priceLabel: "FREE",
  },
  {
    id: "tea",
    name: "Tea",
    emoji: "☕",
    priceLabel: "FREE",
  },
  {
    id: "flowers",
    name: "flower bouquet",
    emoji: "💐",
    priceLabel: "FREE",
  },
  {
    id: "joke",
    name: "Terrible Joke",
    emoji: "😂",
    priceLabel: "UNFORTUNATELY FREE",
  },
  {
    id: "spiderman",
    name: "Spider-Man Costume",
    emoji: "🕷️",
    priceLabel: "FREE",
  },
];