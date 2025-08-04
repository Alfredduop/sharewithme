import { ShareWithMeLogo } from "../ShareWithMeLogo";
import { EmailSubscription } from "../EmailSubscription";
import { FOOTER_SECTIONS } from "../../lib/landingPageConstants";

interface FooterProps {
  navigationHandlers: {
    startQuiz: () => void;
    startListing: () => void;
    openMarketplace: () => void;
    openBlog: () => void;
    openContact: () => void;
    openTerms: () => void;
  };
}

export const Footer = ({ navigationHandlers }: FooterProps) => {
  const handleAction = (action: string) => {
    switch (action) {
      case 'startQuiz':
        navigationHandlers.startQuiz();
        break;
      case 'startListing':
        navigationHandlers.startListing();
        break;
      case 'openMarketplace':
        navigationHandlers.openMarketplace();
        break;
      case 'openBlog':
        navigationHandlers.openBlog();
        break;
      case 'openContact':
        navigationHandlers.openContact();
        break;
      case 'openTerms':
        navigationHandlers.openTerms();
        break;
    }
  };

  return (
    <footer className="bg-stone-900 text-stone-300 py-12 px-4 sm:px-6 lg:px-8" role="contentinfo">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <ShareWithMeLogo size="md" variant="dark" />
            <p className="text-stone-400 text-sm">
              Australia&apos;s smartest platform for finding compatible flatmates through AI-powered matching.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">{FOOTER_SECTIONS.platform.title}</h3>
            <div className="space-y-2 text-sm">
              {FOOTER_SECTIONS.platform.links.map((link) => (
                <button 
                  key={link.label}
                  onClick={(e) => {
                    e.preventDefault();
                    console.log(`🎯 Footer ${link.label} button clicked`);
                    handleAction(link.action);
                  }}
                  className="block hover:text-white transition-colors py-2 text-left w-full min-h-[44px] rounded-lg hover:bg-white/10"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">{FOOTER_SECTIONS.support.title}</h3>
            <div className="space-y-2 text-sm">
              {FOOTER_SECTIONS.support.links.map((link) => (
                link.href ? (
                  <a 
                    key={link.label}
                    href={link.href} 
                    className="block hover:text-white transition-colors py-2 min-h-[44px] flex items-center rounded-lg hover:bg-white/10"
                  >
                    {link.label}
                  </a>
                ) : (
                  <button 
                    key={link.label}
                    onClick={() => handleAction(link.action!)}
                    className="block hover:text-white transition-colors py-2 text-left w-full min-h-[44px] rounded-lg hover:bg-white/10"
                  >
                    {link.label}
                  </button>
                )
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Stay Connected</h3>
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <p className="text-stone-400">hello@sharewithme.io</p>
                <p className="text-stone-400">Follow our journey as we build Australia's best sharehouse platform.</p>
              </div>
              
              {/* Email Subscription in Footer */}
              <div className="pt-2">
                <EmailSubscription 
                  variant="compact"
                  title="Get Updates"
                  description="Subscribe for launch notifications and exclusive updates."
                  source="footer"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-stone-800 mt-8 pt-8 text-center text-sm text-stone-400">
          <p>&copy; 2024 Share With Me. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};