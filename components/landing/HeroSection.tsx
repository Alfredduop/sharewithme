import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { motion } from "motion/react";
import { Search, Plus, Shield, Heart, Users } from "lucide-react";

interface HeroSectionProps {
  isMobile: boolean;
  isLowEndDevice: boolean;
  onStartQuiz: () => void;
  onStartListing: () => void;
}

export function HeroSection({ isMobile, onStartQuiz, onStartListing }: HeroSectionProps) {
  return (
    <section className="pt-16 pb-24 px-4">
      <div className="container mx-auto max-w-4xl text-center">
        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Badge variant="outline" className="px-4 py-2 text-purple-700 border-purple-200 bg-purple-50">
            <Shield className="h-4 w-4 mr-2" />
            100% ID Verified • Secure • Free
          </Badge>
        </motion.div>

        {/* Main Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-stone-900 mb-6 leading-tight">
            Find Your Perfect
            <span className="block text-transparent bg-gradient-to-r from-purple-600 via-cyan-600 to-emerald-600 bg-clip-text">
              Flatmate Match
            </span>
          </h1>
          <p className="text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed">
            AI-powered personality matching connects you with compatible flatmates. 
            Skip the stress, find your tribe.
          </p>
        </motion.div>

        {/* Action Buttons - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <div className="flex flex-col gap-4 justify-center max-w-sm mx-auto">
            <Button
              onClick={onStartQuiz}
              size={isMobile ? "default" : "lg"}
              className="bg-purple-600 hover:bg-purple-700 text-white mobile-touch-target px-8 py-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Search className="h-5 w-5 mr-2" />
              Find Flatmates
            </Button>
            <Button
              onClick={onStartListing}
              variant="outline"
              size={isMobile ? "default" : "lg"}
              className="border-2 border-purple-200 text-purple-700 hover:bg-purple-50 mobile-touch-target px-8 py-4 rounded-xl font-medium hover:border-purple-300 transition-all duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              List Property
            </Button>
          </div>
        </motion.div>

        {/* Key Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Heart className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-stone-900 mb-2">Smart Matching</h3>
            <p className="text-stone-600 text-sm">AI analyses lifestyle and personality for perfect compatibility</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-cyan-600" />
            </div>
            <h3 className="font-semibold text-stone-900 mb-2">Verified Users</h3>
            <p className="text-stone-600 text-sm">Government ID verification ensures safe, trusted connections</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-stone-900 mb-2">Community First</h3>
            <p className="text-stone-600 text-sm">Built for students and young Australians by people who get it</p>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 pt-8 border-t border-stone-200"
        >
          <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">100%</div>
              <div className="text-xs text-stone-500">ID Verified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-600">Free</div>
              <div className="text-xs text-stone-500">Always</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">AI</div>
              <div className="text-xs text-stone-500">Powered</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}