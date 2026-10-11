import leaves from "@/assets/leaves.jpg";
import moss from "@/assets/moss.jpg";
import bird from "@/assets/bird.jpg";
import river from "@/assets/river.jpg";
import meadow from "@/assets/meadow.jpg";
import hero from "@/assets/hero.jpg";
import type { Category, Mission } from "@/lib/types";

const t = "2026-01-01T00:00:00.000Z";

export const SAMPLE_MISSIONS: Mission[] = [
  {
    id: "shape-collector",
    title: "The shape collector",
    description: "Find three leaves that tell three different stories.",
    duration: 10,
    difficulty: "Gentle",
    category: "Find",
    steps: [
      "Walk slowly until a leaf catches your eye.",
      "Find two more with completely different shapes or edges.",
      "Notice the veins, the colour, any bite marks or spots.",
      "Leave living leaves on the plant — choose fallen ones if you collect.",
    ],
    curiosity: "Leaf edges hint at climate: toothed edges are more common in cooler places.",
    createdAt: t,
    updatedAt: t,
    completed: false,
    version: 1,
    image: leaves.src,
    source: "sample",
  },
  {
    id: "tiny-world",
    title: "A tiny world",
    description:
      "Choose a small patch of ground. Discover how much can happen in a place most people never look at twice.",
    duration: 20,
    difficulty: "Curious",
    category: "Notice",
    steps: [
      "Find a safe patch of ground without stepping on plants.",
      "Notice three textures and two different colours.",
      "Look for tiny signs of change.",
      "Observe without disturbing the habitat.",
      "Leave everything as you found it.",
    ],
    curiosity:
      "A small patch of ground can contain multiple micro-habitats with different light and moisture conditions.",
    createdAt: t,
    updatedAt: t,
    completed: false,
    version: 1,
    image: moss.src,
    source: "sample",
  },
  {
    id: "morning-chorus",
    title: "Three voices",
    description: "Stand still long enough to hear three different birds.",
    duration: 10,
    difficulty: "Gentle",
    category: "Listen",
    steps: [
      "Find a place to stand or sit near a tree or hedge.",
      "Close your eyes for one full minute.",
      "Count the different calls you hear — high, low, repeating.",
      "Try to tell which direction each one comes from.",
    ],
    curiosity: "Many birds sing loudest in the hour after sunrise, when sound carries furthest.",
    createdAt: t,
    updatedAt: t,
    completed: false,
    version: 1,
    image: bird.src,
    source: "sample",
  },
  {
    id: "water-reading",
    title: "Reading the water",
    description: "Watch moving water until it tells you something about the land.",
    duration: 20,
    difficulty: "Curious",
    category: "Reflect",
    steps: [
      "Stay a safe distance from the edge.",
      "Follow one floating thing with your eyes as far as you can.",
      "Notice where water rushes and where it rests.",
      "Sit for five minutes and let your thoughts slow to its pace.",
    ],
    curiosity: "Smooth, rounded stones have travelled far — water polishes them over many years.",
    createdAt: t,
    updatedAt: t,
    completed: false,
    version: 1,
    image: river.src,
    source: "sample",
  },
  {
    id: "edge-walk",
    title: "Walk the edge",
    description: "Follow the line where two kinds of land meet.",
    duration: 30,
    difficulty: "Explorer",
    category: "Move",
    steps: [
      "Find an edge: where grass meets trees, path meets meadow, or wet meets dry.",
      "Walk along it slowly for ten minutes.",
      "Notice which plants or creatures live only on one side.",
      "Turn back and walk it again — what did you miss?",
    ],
    curiosity: "Ecologists call these edges ecotones. They are often richer in life than either side.",
    createdAt: t,
    updatedAt: t,
    completed: false,
    version: 1,
    image: meadow.src,
    source: "sample",
  },
];

export const CATEGORY_IMAGES: Record<Category, string> = {
  Notice: moss.src,
  Listen: bird.src,
  Find: leaves.src,
  Reflect: river.src,
  Move: meadow.src,
};

export const FALLBACK_IMAGE = hero.src;
