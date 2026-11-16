export type Category = {
  slug: string;
  name: string;
  icon: string;
  desc: string;
  subs: string[];
};

export const categories: Category[] = [
  { slug: "web-development", name: "Web Development", icon: "code", desc: "Websites, apps and smart-contract frontends.", subs: ["Website Development", "Frontend Development", "Backend Development", "Smart Contract Development", "DApp Development"] },
  { slug: "graphic-design", name: "Graphic Design", icon: "palette", desc: "Logos, brands and UI/UX design.", subs: ["Logo Design", "Brand Identity", "Social Media Graphics", "UI/UX Design", "Banner Design"] },
  { slug: "video-animation", name: "Video & Animation", icon: "video", desc: "Editing, motion and animation.", subs: ["Video Editing", "Motion Graphics", "2D Animation", "YouTube Editing", "AI Video Production"] },
  { slug: "writing-translation", name: "Writing & Translation", icon: "pen", desc: "Articles, copy, docs and translation.", subs: ["Blog Writing", "Copywriting", "Technical Writing", "Translation", "Documentation"] },
  { slug: "ai-automation", name: "AI & Automation", icon: "bot", desc: "Agents, chatbots and workflow automation.", subs: ["AI Agents", "Chatbot Development", "Workflow Automation", "Prompt Engineering", "AI Integrations"] },
  { slug: "blockchain-web3", name: "Blockchain & Web3", icon: "coins", desc: "Contracts, DeFi and Web3 community.", subs: ["Smart Contract Development", "DApp Development", "Blockchain Research", "DeFi Integrations", "Web3 Community Management"] },
  { slug: "marketing-social", name: "Marketing & Social Media", icon: "megaphone", desc: "Growth, SEO and community.", subs: ["X Account Management", "Community Management", "Content Strategy", "SEO", "Marketing Campaigns"] },
  { slug: "virtual-assistance", name: "Virtual Assistance", icon: "headset", desc: "Admin, support and research help.", subs: ["Data Entry", "Online Research", "Email Management", "Customer Support", "Administrative Tasks"] },
  { slug: "mobile-apps", name: "Mobile App Development", icon: "phone", desc: "Android, iOS and cross-platform apps.", subs: ["Android Development", "iOS Development", "React Native", "Flutter", "App Testing"] },
  { slug: "data-research", name: "Data & Research", icon: "data", desc: "Analysis, dashboards and research.", subs: ["Data Analysis", "Excel Dashboards", "Data Visualization", "Market Research", "Business Research"] },
];
