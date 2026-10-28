/**
 * Everything the site says about Aryan lives here, in the same order as the CV.
 * Links left as "" are hidden on the page until you fill them in.
 */

const email = "aryanraj0828@gmail.com"

export const profile = {
  name: "Aryan Kumar",
  email,
  links: {
    github: "https://github.com/alpha730",
    linkedin: "https://www.linkedin.com/in/aryan-kumar-ai/",
    cv: "https://drive.google.com/file/d/1YoAHcQ9oWYsMibir773JmaEu5Sltpc_S/view?usp=sharing",
    // Gmail's compose window: a mailto: link does nothing on computers with no mail app set up
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`,
  },
}

export const education = [
  {
    school: "Jaipur Engineering College and Research Centre Foundation",
    place: "Jaipur, India",
    degree: "B.Tech, Artificial Intelligence & Data Science",
    when: "2025 – 2029 (expected)",
    cgpa: 8.3,
  },
  {
    school: "St. Xavier's School",
    degree: "ISC (Class XII)",
    when: "2024",
  },
]

export const research = [
  {
    title: "Robustness of LLM Agents to Indirect Prompt Injection",
    when: "Sep 2026 – Oct 2026",
    kind: "Independent project",
    github: "", // the project's repository, once it is public
    points: [
      "Built a LangGraph tool-using agent (Qwen via Groq) that answers remote-sensing questions over real Sentinel-2 NDVI, Sentinel-1 water-extent and ERA5 rainfall data for 6 regions in India.",
      "Designed 20 tasks with automatic answer checks, 5 injection styles (incl. Hindi) in 2 placements, and 2 defenses (untrusted-data tagging, action gate); ran 660 runs measuring attack success and task utility together, AgentDojo-style.",
      "Result: 0 of 600 attacked runs led to a harmful action, with 100% exposure; task success 96.5–100%; the agent flagged the injection in ≥88.5–96% of runs with no false alarms. Wrote a 6-page report with limitations; code and run traces are public.",
    ],
    tally: [
      { n: 6, label: "Regions of India" },
      { n: 20, label: "Tasks" },
      { n: 5, label: "Attack styles" },
      { n: 2, label: "Placements" },
      { n: 2, label: "Defenses" },
      { n: 660, label: "Evaluation runs" },
    ],
  },
]

export const projects = [
  {
    title: "AI-Powered Remote Sensing Analysis Platform",
    stack: ["Python", "PyTorch", "LangChain", "Rasterio/GDAL"],
    github: "", // the project's repository
    points: [
      "Built an agentic system for Earth-observation tasks on multi-modal satellite imagery (SAR and multispectral), including visual question answering (VQA).",
      "Combined RAG, LLMs, PyTorch computer-vision models and geospatial processing (Rasterio/GDAL, GeoPandas).",
    ],
    relic: "The Palantír",
    lore: "A seeing-stone for satellite imagery: ask it about far-off lands and it answers.",
    art: "palantir" as const,
  },
  {
    title: "AI Voice Agent for Community Health Workers",
    stack: ["Next.js", "TypeScript", "Sarvam AI", "Groq", "Supabase"],
    github: "",
    points: [
      "Developed a multilingual voice agent that converts spoken home-visit reports from ASHA and Anganwadi workers (Hindi, English, Marwari) into structured health records, using Sarvam Saaras v3 streaming speech-to-text, LLM-based extraction and Supabase.",
      "Engineered a safety-first child-triage pipeline (IMNCI) that separates LLM symptom extraction from a deterministic, source-cited rules engine built on the 2023 NHM guidelines; validated with 139 automated tests.",
    ],
    relic: "The Horn of Gondor",
    lore: "A call that is always answered: health workers speak, and the record writes itself.",
    art: "voice" as const,
  },
  {
    title: "Decade Hunt: Duolingo English Test × JECRC AR Game",
    stack: ["React", "TypeScript", "MindAR", "Firebase"],
    github: "",
    points: [
      "Built and deployed the AR game for Duolingo's 10-year campaign at JECRC, Duolingo's partner college in India: students scan official Duolingo posters to catch “Lingos” in AR.",
      "Designed the game's level system (Lv 1, Lv 2, MAX), with streaks that players maintain to unlock higher levels; played by JECRC students at the campus event on Oct 22, 2026.",
      "Worked with Duolingo's Mumbai team to adapt the app to Duolingo English Test brand guidelines, using official mascots and posters; hosted on Firebase.",
    ],
    relic: "Thrór's Map",
    lore: "Its moon-letters show only when the light falls right: scan the poster, and the Lingo appears.",
    art: "map" as const,
  },
]

/** span: how many of the four grid columns a card takes on wide screens */
export const skills = [
  { label: "Languages", items: ["Python", "Java"], rune: "ᛏ", span: 1 },
  { label: "ML/DL", items: ["PyTorch", "scikit-learn"], rune: "ᛗ", span: 1 },
  { label: "LLMs & Agents", items: ["LangGraph", "LangChain", "CrewAI", "RAG", "Vector databases"], rune: "ᚹ", span: 2 },
  { label: "Geospatial", items: ["Rasterio/GDAL", "GeoPandas", "Sentinel-1/2 data", "STAC"], rune: "ᛞ", span: 2 },
  { label: "Web", items: ["React", "Node.js", "Next.js", "TypeScript"], rune: "ᛖ", span: 1 },
  { label: "Tools", items: ["Git", "Supabase", "Vercel", "Render", "n8n"], rune: "ᚠ", span: 1 },
  { label: "Spoken languages", items: ["English (professional)", "Hindi (native)"], rune: "ᛚ", span: 4 },
]

export const experience = [
  {
    org: "Qualfocus",
    role: "AI Engineer",
    when: "Apr 2026 – Jun 2026",
    points: ["Worked on an interior-design visualization app that brings real-world spaces into a virtual environment."],
  },
]

export const certifications = [
  {
    title: "IBM RAG and Agentic AI Professional Certificate",
    issuer: "Coursera",
    url: "https://www.coursera.org/account/accomplishments/specialization/G5XB7X5DNOF3?utm_source=link&utm_medium=certificate&utm_content=cert_image&utm_campaign=sharing_cta&utm_product=prof", // the "View certificate" link
  },
]
