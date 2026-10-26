/**
 * TOC (Theory of Computation) - BCS503 module data.
 * To migrate to Supabase Storage, replace the local /toc/ URLs
 * with Supabase public bucket URLs in this single file.
 */

export interface TocModule {
  number: number;
  title: string;
  topics: string[];
  /** URL for the textbook PDF, or null if unavailable */
  textbook: string | null;
  /** URL for the written notes PDF, or null if unavailable */
  writtenNotes: string | null;
}

export const TOC_SUBJECT = {
  name: "Theory of Computation",
  code: "BCS503",
  faculty: "Harshitha H V",
  semester: 5,
};

export const TOC_MODULES: TocModule[] = [
  {
    number: 1,
    title: "Introduction to Finite Automata",
    topics: [
      "Introduction to Finite Automata",
      "Structural Representations & Automata and Complexity",
      "Deterministic Finite Automata (DFA)",
      "Nondeterministic Finite Automata (NFA)",
      "Finite Automata with Epsilon-Transitions (ε-NFA)",
    ],
    textbook: "/toc/BCS503-module-1-textbook.pdf",
    writtenNotes: "/toc/BCS503-module-1-written.pdf",
  },
  {
    number: 2,
    title: "Regular Expressions",
    topics: [
      "Regular Expressions",
      "Finite Automata and Regular Expressions",
      "Proving Languages Not to Be Regular",
      "Closure Properties of Regular Languages",
      "Equivalence and Minimization of Automata",
    ],
    textbook: "/toc/BCS503-module-2-textbook.pdf",
    writtenNotes: "/toc/BCS503-module-2-written.pdf",
  },
  {
    number: 3,
    title: "Context-Free Grammars",
    topics: [
      "Context-Free Grammars (CFG)",
      "Parse Trees",
      "Ambiguity in Grammars and Languages",
      "Pushdown Automata (PDA)",
      "Equivalence of PDAs and CFGs",
      "Deterministic Pushdown Automata",
    ],
    textbook: "/toc/BCS503-module-3-textbook.pdf",
    writtenNotes: "/toc/BCS503-module-3-written.pdf",
  },
  {
    number: 4,
    title: "Context-Free Languages",
    topics: [
      "Normal Forms for Context-Free Grammars",
      "The Pumping Lemma for Context-Free Languages",
      "Closure Properties of Context-Free Languages",
    ],
    textbook: "/toc/BCS503-module-4-textbook.pdf",
    writtenNotes: "/toc/BCS503-module-4-written.pdf",
  },
  {
    number: 5,
    title: "Turing Machines",
    topics: [
      "Introduction to Turing Machines",
      "Problems That Computers Cannot Solve",
      "The Turing Machine",
      "Programming Techniques for Turing Machines",
      "Extensions to the Basic Turing Machine",
      "Undecidability",
    ],
    textbook: "/toc/BCS503-module-5-textbook.pdf",
    writtenNotes: "/toc/BCS503-module-5-written.pdf",
  },
];

/**
 * Previous Question Papers for TOC (BCS503).
 * Add entries here when question paper files are available.
 * Example: { label: "Dec 2023", url: "/toc/BCS503-pqp-dec2023.pdf" }
 */
export const TOC_QUESTION_PAPERS: { label: string; url: string }[] = [
  { label: "WhatsApp Image 2026-10-26 at 3.27.04 PM", url: "/pypapers/WhatsApp Image 2026-10-26 at 3.27.04 PM.jpeg" },
  { label: "WhatsApp Image 2026-10-26 at 3.27.05 PM", url: "/pypapers/WhatsApp Image 2026-10-26 at 3.27.05 PM.jpeg" },
  { label: "WhatsApp Image 2026-10-26 at 3.27.06 PM (1)", url: "/pypapers/WhatsApp Image 2026-10-26 at 3.27.06 PM (1).jpeg" },
  { label: "WhatsApp Image 2026-10-26 at 3.27.06 PM (2)", url: "/pypapers/WhatsApp Image 2026-10-26 at 3.27.06 PM (2).jpeg" },
  { label: "WhatsApp Image 2026-10-26 at 3.27.06 PM", url: "/pypapers/WhatsApp Image 2026-10-26 at 3.27.06 PM.jpeg" },
  { label: "WhatsApp Image 2026-10-26 at 3.27.07 PM", url: "/pypapers/WhatsApp Image 2026-10-26 at 3.27.07 PM.jpeg" },
  { label: "WhatsApp Image 2026-10-26 at 3.27.08 PM (1)", url: "/pypapers/WhatsApp Image 2026-10-26 at 3.27.08 PM (1).jpeg" },
  { label: "WhatsApp Image 2026-10-26 at 3.27.08 PM (2)", url: "/pypapers/WhatsApp Image 2026-10-26 at 3.27.08 PM (2).jpeg" },
  { label: "WhatsApp Image 2026-10-26 at 3.27.08 PM", url: "/pypapers/WhatsApp Image 2026-10-26 at 3.27.08 PM.jpeg" },
  { label: "WhatsApp Image 2026-10-26 at 3.27.09 PM (1)", url: "/pypapers/WhatsApp Image 2026-10-26 at 3.27.09 PM (1).jpeg" },
  { label: "WhatsApp Image 2026-10-26 at 3.27.09 PM (2)", url: "/pypapers/WhatsApp Image 2026-10-26 at 3.27.09 PM (2).jpeg" },
  { label: "WhatsApp Image 2026-10-26 at 3.27.09 PM", url: "/pypapers/WhatsApp Image 2026-10-26 at 3.27.09 PM.jpeg" },
  { label: "WhatsApp Image 2026-10-26 at 3.27.10 PM (1)", url: "/pypapers/WhatsApp Image 2026-10-26 at 3.27.10 PM (1).jpeg" },
  { label: "WhatsApp Image 2026-10-26 at 3.27.10 PM (2)", url: "/pypapers/WhatsApp Image 2026-10-26 at 3.27.10 PM (2).jpeg" },
  { label: "WhatsApp Image 2026-10-26 at 3.27.10 PM", url: "/pypapers/WhatsApp Image 2026-10-26 at 3.27.10 PM.jpeg" },
  { label: "WhatsApp Image 2026-10-26 at 3.27.11 PM (1)", url: "/pypapers/WhatsApp Image 2026-10-26 at 3.27.11 PM (1).jpeg" },
  { label: "WhatsApp Image 2026-10-26 at 3.27.11 PM", url: "/pypapers/WhatsApp Image 2026-10-26 at 3.27.11 PM.jpeg" },
  { label: "WhatsApp Image 2026-10-26 at 3.27.12 PM", url: "/pypapers/WhatsApp Image 2026-10-26 at 3.27.12 PM.jpeg" },
];
