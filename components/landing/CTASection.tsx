import { motion } from "motion/react";
import { Button } from "../ui/button";
import { Brain, ArrowRight, BookOpen } from "lucide-react";
import { EmailSubscription } from "../EmailSubscription";

interface CTASectionProps {
  onStartQuiz: () => void;
  onOpenBlog: () => void;
}

export const CTASection = ({ onStartQuiz, onOpenBlog }: CTASectionProps) => {
  return (
    <>
      {/* Main CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 via-cyan-600 to-emerald-600" aria-labelledby="cta-heading">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 id="cta-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Find Your Perfect Flatmate?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join us on our journey as we help Aussies find their perfect sharehouse match.
            </p>
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row justify-center w-full max-w-sm sm:max-w-none mx-auto mb-12">
              <Button 
                size="lg" 
                className="w-full sm:w-auto min-h-[44px] sm:min-h-[56px] bg-white text-purple-600 hover:bg-stone-50 text-sm sm:text-lg px-4 sm:px-8 py-2.5 sm:py-4 shadow-lg transition-all duration-200 active:scale-95 rounded-lg sm:rounded-xl"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🎯 Start Your Journey button clicked');
                  onStartQuiz();
                }}
              >
                <Brain className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="font-medium">Start Your Journey</span>
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="w-full sm:w-auto min-h-[44px] sm:min-h-[56px] border-2 border-white/80 bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-purple-600 text-sm sm:text-lg px-4 sm:px-8 py-2.5 sm:py-4 transition-all duration-200 active:scale-95 relative z-10 rounded-lg sm:rounded-xl"
                onClick={onOpenBlog}
              >
                <BookOpen className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="font-medium">Learn More</span>
              </Button>
            </div>

            {/* Stay Updated Section */}
            <EmailSubscription 
              variant="compact"
              title="Stay Updated"
              description="Be the first to know when we launch and get exclusive updates about new features."
              className="max-w-md mx-auto"
              source="cta_section"
            />
          </motion.div>
        </div>
      </section>

      {/* Alternative Newsletter Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-stone-50">
        <div className="container mx-auto">
          <EmailSubscription 
            variant="default"
            title="Join Our Community"
            description="Get exclusive insights, tips for sharehousing, and be the first to access new features when we launch."
            className="max-w-2xl mx-auto"
            source="newsletter_section"
          />
        </div>
      </section>
    </>
  );
};