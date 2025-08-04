import {
  Brain,
  Shield,
  DollarSign,
  MessageCircle,
  Store,
  Star,
} from "lucide-react";

export const HERO_BENEFITS = [
  { 
    icon: Brain, 
    text: "AI Personality Matching", 
    colour: "from-purple-500 to-purple-600" 
  },
  { 
    icon: Shield, 
    text: "100% Verified Users", 
    colour: "from-emerald-500 to-emerald-600" 
  },
  { 
    icon: DollarSign, 
    text: "Free for All Users", 
    colour: "from-cyan-500 to-cyan-600" 
  }
];

export const PLATFORM_FEATURES = [
  {
    icon: Brain,
    title: "AI-Powered Matching",
    description: "Our sophisticated algorithm analyses personality, lifestyle, and preferences to find your perfect flatmate match.",
    gradient: "from-purple-500 to-purple-600"
  },
  {
    icon: Shield,
    title: "100% Verified Users",
    description: "Every user goes through comprehensive ID verification, ensuring safety and authenticity in our community.",
    gradient: "from-emerald-500 to-emerald-600"
  },
  {
    icon: DollarSign,
    title: "Free for All Users",
    description: "No hidden fees, no premium tiers. Share With Me is free for all users.",
    gradient: "from-cyan-500 to-cyan-600"
  },
  {
    icon: MessageCircle,
    title: "In-App Messaging",
    description: "Connect and chat with potential flatmates directly through our secure messaging system.",
    gradient: "from-pink-500 to-pink-600"
  },
  {
    icon: Store,
    title: "Community Marketplace",
    description: "Buy, sell, and trade items with verified community members through our built-in marketplace.",
    gradient: "from-orange-500 to-orange-600"
  },
  {
    icon: Star,
    title: "Smart Recommendations",
    description: "Get personalised property and flatmate recommendations based on your unique preferences.",
    gradient: "from-yellow-500 to-yellow-600"
  }
];

export const FOOTER_SECTIONS = {
  platform: {
    title: "Platform",
    links: [
      { label: "Find Matches", action: "startQuiz" },
      { label: "List Property", action: "startListing" },
      { label: "Marketplace", action: "openMarketplace" },
      { label: "Blog", action: "openBlog" }
    ]
  },
  support: {
    title: "Support",
    links: [
      { label: "Contact Us", action: "openContact" },
      { label: "Terms of Service", action: "openTerms" },
      { label: "Privacy Policy", href: "/privacy" }
    ]
  },
  connect: {
    title: "Connect",
    content: [
      "hello@sharewithme.io",
      "Made with ❤️ in Australia"
    ]
  }
};