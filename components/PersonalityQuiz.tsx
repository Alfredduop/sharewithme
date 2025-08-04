import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Slider } from "./ui/slider";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { ShareWithMeLogo } from "./ShareWithMeLogo";
import { googleSheets } from "../lib/googleSheets";
import { 
  validateQuizAnswers, 
  analyzePersonality, 
  extractMatchPreferences, 
  extractPropertyPreferences,
  ValidationError,
  type QuizAnswers 
} from "../lib/aiMatching";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Home,
  Users,
  Clock,
  Coffee,
  Music,
  Utensils,
  Gamepad2,
  BookOpen,
  Heart,
  Star,
  Sparkles,
  Check,
  X,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  PartyPopper,
  Bed,
  Sofa,
  ChefHat,
  Headphones,
  DumbbellIcon,
  PawPrint,
  Cigarette,
  Wine,
  GraduationCap,
  Briefcase,
  MapPin,
  Calendar,
  Navigation,
  MessageCircle,
  UserPlus,
  Shield,
  FileText,
  Bath,
  Users2,
  Wifi,
  Car,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from "lucide-react";

interface PersonalityQuizProps {
  onBack: () => void;
  onQuizComplete: () => void;
  onAuthRequired?: () => void;
  user?: any;
  onUserUpdate?: (updatedUser: any) => void;
}

interface QuizQuestion {
  id: string;
  category: string;
  type: 'slider' | 'radio' | 'checkbox' | 'boolean' | 'text' | 'textarea';
  question: string;
  description?: string;
  icon: any;
  options?: string[];
  min?: number;
  max?: number;
  labels?: { min: string; max: string };
  required?: boolean;
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
}

// Australian states and territories
const australianStates = [
  'New South Wales (NSW)',
  'Victoria (VIC)',
  'Queensland (QLD)',
  'Western Australia (WA)',
  'South Australia (SA)',
  'Tasmania (TAS)',
  'Australian Capital Territory (ACT)',
  'Northern Territory (NT)'
];

const quizQuestions: QuizQuestion[] = [
  // Personal Basics & Location
  {
    id: 'age',
    category: 'About You',
    type: 'slider',
    question: 'How old are you?',
    icon: Calendar,
    min: 18,
    max: 65,
    labels: { min: '18', max: '65+' },
    required: true
  },
  {
    id: 'occupation',
    category: 'About You',
    type: 'radio',
    question: 'What best describes your current situation?',
    icon: Briefcase,
    options: ['Student', 'Full-time worker', 'Part-time worker', 'Freelancer', 'Job seeker', 'Other'],
    required: true
  },
  {
    id: 'state',
    category: 'About You',
    type: 'radio',
    question: 'Which Australian state or territory are you looking in?',
    icon: Navigation,
    options: australianStates,
    required: true
  },
  {
    id: 'preferred_locations',
    category: 'About You',
    type: 'text',
    question: 'What suburbs or areas are you considering? (Separate multiple locations with commas)',
    description: 'Enter all suburbs/areas you\'d consider living in to widen your matching options',
    icon: MapPin,
    placeholder: 'e.g. Surry Hills, Newtown, Marrickville, Redfern...',
    required: true,
    validation: {
      minLength: 3,
      maxLength: 500
    }
  },
  {
    id: 'location_preference',
    category: 'About You', 
    type: 'checkbox',
    question: 'What\'s important for your location? (Select all that apply)',
    icon: MapPin,
    options: ['Near public transport', 'Near universities', 'Near beaches', 'Near nightlife', 'Quiet neighborhoods', 'Near shopping centers', 'Near gyms/parks'],
    required: true
  },

  // About Me Bio Section
  {
    id: 'bio',
    category: 'About You',
    type: 'textarea',
    question: 'Tell us a bit about yourself',
    description: 'Share your interests, what you\'re looking for in a flatmate, or anything that helps others get to know you better',
    icon: FileText,
    placeholder: 'e.g. I\'m a friendly uni student studying marketing. I love cooking, going to the gym, and having movie nights. Looking for someone who\'s clean, respectful, and up for the occasional chat over coffee...',
    required: false,
    validation: {
      maxLength: 2000
    }
  },

  // Sleep & Daily Routine
  {
    id: 'morning_person',
    category: 'Daily Routine',
    type: 'slider',
    question: 'Are you a morning person or night owl?',
    description: 'This helps us match you with people who have similar schedules',
    icon: Sun,
    min: 0,
    max: 10,
    labels: { min: 'Total night owl 🦉', max: 'Early bird 🐦' },
    required: true
  },
  {
    id: 'bedtime',
    category: 'Daily Routine',
    type: 'radio',
    question: 'When do you usually go to bed on weeknights?',
    icon: Bed,
    options: ['Before 9pm', '9-10pm', '10-11pm', '11pm-12am', '12-1am', 'After 1am'],
    required: true
  },
  {
    id: 'noise_sensitivity',
    category: 'Daily Routine',
    type: 'slider',
    question: 'How sensitive are you to noise when sleeping?',
    icon: Volume2,
    min: 0,
    max: 10,
    labels: { min: 'Sleep through anything 😴', max: 'Light sleeper 👂' },
    required: true
  },

  // Social Preferences
  {
    id: 'socialness',
    category: 'Social Life',
    type: 'slider',
    question: 'How social do you want your living situation to be?',
    description: 'Do you want flatmates who hang out or prefer your own space?',
    icon: Users,
    min: 0,
    max: 10,
    labels: { min: 'Keep to myself 🚪', max: 'Best friends vibe 👥' },
    required: true
  },
  {
    id: 'guests',
    category: 'Social Life',
    type: 'radio',
    question: 'How often do you have friends over?',
    icon: PartyPopper,
    options: ['Rarely/never', 'Once a month', '2-3 times a month', 'Weekly', 'Multiple times a week'],
    required: true
  },
  {
    id: 'parties',
    category: 'Social Life',
    type: 'boolean',
    question: 'Are you okay with occasional house parties?',
    icon: Music,
    required: true
  },

  // Cleanliness & Organization
  {
    id: 'cleanliness',
    category: 'Living Habits',
    type: 'slider',
    question: 'How important is cleanliness to you?',
    description: 'From "lived-in" to "magazine-ready"',
    icon: Sparkles,
    min: 0,
    max: 10,
    labels: { min: 'Pretty relaxed 🤷', max: 'Spotless always ✨' },
    required: true
  },
  {
    id: 'dishes',
    category: 'Living Habits',
    type: 'radio',
    question: 'How quickly do you do your dishes?',
    icon: Utensils,
    options: ['Immediately after eating', 'Same day', 'Within 2-3 days', 'When I run out of clean ones', 'What dishes? (takeaway life)'],
    required: true
  },
  {
    id: 'common_areas',
    category: 'Living Habits',
    type: 'slider',
    question: 'How much do you use shared living spaces?',
    description: 'Living room, kitchen, balcony etc.',
    icon: Sofa,
    min: 0,
    max: 10,
    labels: { min: 'Mostly in my room 🚪', max: 'Always in common areas 🛋️' },
    required: true
  },

  // Lifestyle & Interests
  {
    id: 'cooking',
    category: 'Interests',
    type: 'slider',
    question: 'How much do you cook at home?',
    icon: ChefHat,
    min: 0,
    max: 10,
    labels: { min: 'Takeaway expert 🍕', max: 'Master chef 👨‍🍳' },
    required: true
  },
  {
    id: 'interests',
    category: 'Interests',
    type: 'checkbox',
    question: 'What are you into? (Select all that apply)',
    icon: Heart,
    options: ['Gaming', 'Reading', 'Fitness/gym', 'Music/concerts', 'Movies/TV', 'Cooking', 'Art/creative stuff', 'Sports', 'Outdoor activities', 'Partying/nightlife', 'Study groups'],
    required: true
  },
  {
    id: 'music_taste',
    category: 'Interests',
    type: 'checkbox',
    question: 'What music do you vibe with?',
    icon: Headphones,
    options: ['Pop', 'Rock', 'Hip-hop/Rap', 'Electronic/EDM', 'Indie', 'Jazz', 'Classical', 'Country', 'R&B', 'Alternative', 'Pretty much everything'],
    required: false
  },

  // Deal Breakers & Preferences
  {
    id: 'smoking',
    category: 'Deal Breakers',
    type: 'radio',
    question: 'What\'s your stance on smoking?',
    icon: Cigarette,
    options: ['I smoke inside', 'I smoke outside only', 'I don\'t smoke but okay with others', 'Prefer smoke-free house'],
    required: true
  },
  {
    id: 'drinking',
    category: 'Deal Breakers',
    type: 'radio',
    question: 'How do you feel about alcohol in the house?',
    icon: Wine,
    options: ['Love a good drink', 'Social drinker', 'Rarely drink', 'Prefer alcohol-free home'],
    required: true
  },
  {
    id: 'pets',
    category: 'Deal Breakers',
    type: 'radio',
    question: 'How do you feel about pets?',
    icon: PawPrint,
    options: ['I have pets', 'Love pets, want to live with them', 'Like pets but don\'t want to live with them', 'Allergic/prefer no pets'],
    required: true
  },

  // Property Preferences
  {
    id: 'furnished_room',
    category: 'Property Preferences',
    type: 'radio',
    question: 'Do you need a furnished room?',
    icon: Bed,
    options: ['Required', 'Preferred', 'Flexible', 'Don\'t want furnished'],
    required: true
  },
  {
    id: 'bathroom',
    category: 'Property Preferences',
    type: 'radio',
    question: 'What bathroom arrangement do you prefer?',
    icon: Bath,
    options: ['Own bathroom (ensuite)', 'Shared bathroom', 'Flexible'],
    required: true
  },
  {
    id: 'max_flatmates',
    category: 'Property Preferences',
    type: 'radio',
    question: 'Maximum number of flatmates you\'re comfortable with?',
    icon: Users2,
    options: ['Just me (studio/1BR)', '1 other flatmate', '2-3 flatmates', '4+ flatmates', 'Flexible'],
    required: true
  },
  {
    id: 'internet',
    category: 'Property Preferences',
    type: 'radio',
    question: 'How important is internet access?',
    icon: Wifi,
    options: ['Required (fast broadband)', 'Required (basic internet)', 'Nice to have', 'Not important'],
    required: true
  },
  {
    id: 'parking',
    category: 'Property Preferences',
    type: 'radio',
    question: 'Do you need parking?',
    icon: Car,
    options: ['Required (off-street)', 'Required (street parking okay)', 'Nice to have', 'Flexible', 'Don\'t need parking'],
    required: true
  },

  // Final Preferences
  {
    id: 'gender_preference',
    category: 'Preferences',
    type: 'radio',
    question: 'Do you have a gender preference for flatmates?',
    icon: Users,
    options: ['Any gender', 'Same gender only', 'Mixed gender preferred', 'No strong preference'],
    required: true
  },
  {
    id: 'budget',
    category: 'Preferences',
    type: 'slider',
    question: 'What\'s your weekly rent budget (including bills)?',
    icon: Home,
    min: 100,
    max: 500,
    labels: { min: '$100', max: '$500+' },
    required: true
  }
];

const categories = ['About You', 'Daily Routine', 'Social Life', 'Living Habits', 'Interests', 'Deal Breakers', 'Property Preferences', 'Preferences'];

export const PersonalityQuiz = ({ onBack, onQuizComplete, onAuthRequired, user, onUserUpdate }: PersonalityQuizProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [quizStartTime, setQuizStartTime] = useState<number>(Date.now());
  const [completionError, setCompletionError] = useState<string | null>(null);

  // Track quiz start
  useEffect(() => {
    setQuizStartTime(Date.now());
  }, []);

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
  const currentCategory = currentQuestion?.category;
  const categoryProgress = categories.indexOf(currentCategory) + 1;

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Enter key on desktop (not mobile)
      if (e.key === 'Enter' && window.innerWidth >= 768) {
        e.preventDefault();
        if (isCurrentAnswered() && !isCompleted) {
          nextQuestion();
        }
      }
      
      // Handle arrow keys for navigation
      if (e.key === 'ArrowRight' && window.innerWidth >= 768) {
        e.preventDefault();
        if (isCurrentAnswered() && !isCompleted) {
          nextQuestion();
        }
      }
      
      if (e.key === 'ArrowLeft' && window.innerWidth >= 768) {
        e.preventDefault();
        if (currentQuestionIndex > 0) {
          prevQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestionIndex, answers, isCompleted]);

  const validateCurrentAnswer = (questionId: string, value: any): string | null => {
    const question = quizQuestions.find(q => q.id === questionId);
    if (!question) return null;

    try {
      // Create a temporary answers object for validation
      const tempAnswers = { [questionId]: value };
      validateQuizAnswers(tempAnswers);
      return null;
    } catch (error) {
      if (error instanceof ValidationError) {
        return error.message;
      }
      return 'Invalid input';
    }
  };

  const handleAnswer = (value: any) => {
    const questionId = currentQuestion.id;
    
    // Clear previous validation error
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[questionId];
      return newErrors;
    });

    // Validate the answer
    const validationError = validateCurrentAnswer(questionId, value);
    if (validationError) {
      setValidationErrors(prev => ({
        ...prev,
        [questionId]: validationError
      }));
    }

    // Update answers
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const nextQuestion = async () => {
    // Validate current answer before proceeding
    const currentAnswer = answers[currentQuestion.id];
    const validationError = validateCurrentAnswer(currentQuestion.id, currentAnswer);
    
    if (validationError) {
      setValidationErrors(prev => ({
        ...prev,
        [currentQuestion.id]: validationError
      }));
      return;
    }

    // Continue to next question or complete quiz
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      await completeQuiz();
    }
  };

  const completeQuiz = async () => {
    setIsLoading(true);
    setCompletionError(null);
    
    try {
      console.log('🎯 Starting quiz completion process...');
      
      // Calculate completion time
      const timeToComplete = Date.now() - quizStartTime;
      
      // Validate all answers before processing
      let validatedAnswers: QuizAnswers;
      try {
        validatedAnswers = validateQuizAnswers(answers);
        console.log('✅ Quiz answers validated successfully');
      } catch (validationError) {
        console.warn('⚠️ Quiz validation warning:', validationError);
        validatedAnswers = answers; // Use raw answers if validation fails
      }
      
      // Generate personality analysis
      let personalityTraits, matchPreferences, propertyPreferences;
      try {
        personalityTraits = analyzePersonality(validatedAnswers);
        matchPreferences = extractMatchPreferences(validatedAnswers);
        propertyPreferences = extractPropertyPreferences(validatedAnswers);
        console.log('✅ Personality analysis completed');
      } catch (analysisError) {
        console.error('❌ Analysis error:', analysisError);
        // Generate fallback personality profile
        personalityTraits = generateFallbackPersonality(validatedAnswers);
        matchPreferences = generateFallbackMatchPreferences(validatedAnswers);
        propertyPreferences = generateFallbackPropertyPreferences(validatedAnswers);
        console.log('🔄 Generated fallback personality profile');
      }
      
      // Store results for display and local storage
      const results = {
        answers: validatedAnswers,
        personalityTraits,
        matchPreferences,
        propertyPreferences,
        timeToComplete,
        completedAt: new Date().toISOString()
      };
      setQuizResults(results);
      
      // Always save to localStorage for anonymous users
      try {
        localStorage.setItem('sharewithme_quiz_results', JSON.stringify(results));
        console.log('✅ Quiz results saved to localStorage');
      } catch (localError) {
        console.warn('⚠️ Could not save to localStorage:', localError);
      }
      
      // Save to Google Sheets if user is logged in
      if (user?.id) {
        try {
          await googleSheets.saveQuizResults(user.id, {
            answers: validatedAnswers,
            bio: validatedAnswers.bio || '',
            personality_traits: personalityTraits,
            match_preferences: matchPreferences,
            property_preferences: propertyPreferences,
            completion_time: timeToComplete
          });
          console.log('✅ Quiz results saved to Google Sheets');
          
          // Update user data
          if (onUserUpdate) {
            onUserUpdate({
              ...user,
              personalityScores: personalityTraits,
              propertyPreferences: propertyPreferences,
              bio: validatedAnswers.bio || user.bio
            });
          }
        } catch (saveError) {
          console.warn('⚠️ Save error, but continuing:', saveError);
          setCompletionError('Results saved locally. You can still see your matches!');
        }
      }
      
      // Always mark quiz as completed
      setIsCompleted(true);
      setShowResults(true);
      
    } catch (error) {
      console.error('❌ Critical error in completeQuiz:', error);
      
      // Even if everything fails, still show completion screen
      setIsCompleted(true);
      setShowResults(true);
      setCompletionError('Quiz completed! Some features may be limited, but you can still find matches.');
      
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback personality generation
  const generateFallbackPersonality = (answers: QuizAnswers) => {
    return {
      lifestyle: 'balanced',
      social_energy: 'balanced', 
      cleanliness: 'moderate',
      schedule: 'flexible',
      noise_tolerance: 'moderate',
      guest_policy: 'occasional',
      communication_style: 'diplomatic',
      conflict_resolution: 'mediated',
      shared_spaces: 'moderate',
      personal_space: 'moderate',
      financial_approach: 'shared_equally',
      long_term_goals: answers.occupation === 'Student' ? 'studying' : 'exploring'
    };
  };

  const generateFallbackMatchPreferences = (answers: QuizAnswers) => {
    const age = parseInt(answers.age) || 25;
    return {
      age_range: [Math.max(18, age - 5), Math.min(65, age + 5)] as [number, number],
      location_preferences: answers.preferred_locations ? [answers.preferred_locations] : ['Any location'],
      lifestyle_compatibility: answers.interests || ['General compatibility'],
      deal_breakers: []
    };
  };

  const generateFallbackPropertyPreferences = (answers: QuizAnswers) => {
    return {
      furnished_room: answers.furnished_room || 'Flexible',
      bathroom: answers.bathroom || 'Flexible', 
      max_flatmates: answers.max_flatmates || 'Flexible',
      internet: 'Required (basic internet)',
      parking: 'Flexible'
    };
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const isCurrentAnswered = (): boolean => {
    const answer = answers[currentQuestion?.id];
    const question = currentQuestion;
    
    if (!question?.required) return true;
    
    // Check for validation errors
    if (validationErrors[question.id]) return false;
    
    if (question.type === 'checkbox') {
      return Array.isArray(answer) && answer.length > 0;
    }
    if (question.type === 'text' || question.type === 'textarea') {
      return typeof answer === 'string' && answer.trim().length > 0;
    }
    if (question.type === 'slider') {
      return typeof answer === 'number' && !isNaN(answer);
    }
    
    return answer !== undefined && answer !== null && answer !== '';
  };

  const renderQuestionInput = () => {
    const answer = answers[currentQuestion.id];
    const error = validationErrors[currentQuestion.id];

    switch (currentQuestion.type) {
      case 'text':
        return (
          <div className="space-y-4">
            <Input
              value={answer || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder={currentQuestion.placeholder}
              className={`text-lg p-4 h-14 bg-white/70 border-stone-300 text-stone-900 placeholder:text-stone-500 focus:border-purple-400 focus:ring-purple-400/20 ${
                error ? 'border-red-400 focus:border-red-400' : ''
              }`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isCurrentAnswered()) {
                  e.preventDefault();
                  nextQuestion();
                }
              }}
            />
            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            {currentQuestion.validation?.maxLength && (
              <div className="text-right text-sm text-stone-500">
                {(answer || '').length}/{currentQuestion.validation.maxLength}
              </div>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-4">
            <Textarea
              value={answer || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder={currentQuestion.placeholder}
              className={`text-lg p-4 min-h-[120px] bg-white/70 border-stone-300 text-stone-900 placeholder:text-stone-500 focus:border-purple-400 focus:ring-purple-400/20 resize-none ${
                error ? 'border-red-400 focus:border-red-400' : ''
              }`}
              maxLength={currentQuestion.validation?.maxLength || 2000}
            />
            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            <div className="text-right text-sm text-stone-500">
              {(answer || '').length}/{currentQuestion.validation?.maxLength || 2000} characters
            </div>
          </div>
        );

      case 'slider':
        return (
          <div className="space-y-6">
            <div className="px-4">
              <Slider
                value={[answer !== undefined ? answer : currentQuestion.min || 0]}
                onValueChange={(value) => handleAnswer(value[0])}
                max={currentQuestion.max}
                min={currentQuestion.min}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-sm text-stone-500 px-2">
              <span>{currentQuestion.labels?.min}</span>
              <span className="text-purple-600 font-medium">
                {currentQuestion.id === 'budget' ? `$${answer !== undefined ? answer : currentQuestion.min}` : answer !== undefined ? answer : currentQuestion.min}
              </span>
              <span>{currentQuestion.labels?.max}</span>
            </div>
            {error && (
              <div className="flex items-center justify-center space-x-2 text-red-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-4">
            <RadioGroup value={answer || ''} onValueChange={handleAnswer}>
              <div className="space-y-3">
                {currentQuestion.options?.map((option, index) => (
                  <motion.div 
                    key={option} 
                    className="group"
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <label 
                      htmlFor={option}
                      className="flex items-center space-x-4 p-4 sm:p-5 rounded-xl bg-white/70 hover:bg-white/90 transition-all border border-stone-200 hover:border-purple-400 cursor-pointer min-h-[60px] group-hover:shadow-lg group-hover:shadow-purple-500/10"
                    >
                      <RadioGroupItem value={option} id={option} className="border-stone-400 w-5 h-5 flex-shrink-0" />
                      <span className="text-stone-900 cursor-pointer flex-1 text-base sm:text-lg leading-relaxed">
                        {option}
                      </span>
                    </label>
                  </motion.div>
                ))}
              </div>
            </RadioGroup>
            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        );

      case 'checkbox':
        const selectedOptions = Array.isArray(answer) ? answer : [];
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => {
                const isChecked = selectedOptions.includes(option);
                return (
                  <motion.div 
                    key={option} 
                    className="group"
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <label 
                      className={`flex items-center space-x-4 p-4 sm:p-5 rounded-xl transition-all border cursor-pointer min-h-[60px] group-hover:shadow-lg ${
                        isChecked 
                          ? 'bg-purple-100 border-purple-300 shadow-purple-500/10' 
                          : 'bg-white/70 hover:bg-white/90 border-stone-200 hover:border-purple-400 group-hover:shadow-purple-500/10'
                      }`}
                      onClick={() => {
                        const newSelection = isChecked
                          ? selectedOptions.filter(item => item !== option)
                          : [...selectedOptions, option];
                        handleAnswer(newSelection);
                      }}
                    >
                      <Checkbox 
                        checked={isChecked}
                        onChange={() => {}}
                        className="border-stone-400 w-5 h-5 flex-shrink-0"
                      />
                      <span className="text-stone-900 cursor-pointer flex-1 text-base sm:text-lg leading-relaxed">
                        {option}
                      </span>
                    </label>
                  </motion.div>
                );
              })}
            </div>
            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <motion.button
                className={`p-6 sm:p-8 rounded-xl border-2 transition-all min-h-[100px] ${
                  answer === true 
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-700 shadow-lg shadow-emerald-500/20' 
                    : 'bg-white/70 border-stone-300 text-stone-700 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10'
                }`}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer(true)}
              >
                <Check className="h-8 w-8 mx-auto mb-3" />
                <span className="font-medium text-lg">Yes</span>
              </motion.button>
              <motion.button
                className={`p-6 sm:p-8 rounded-xl border-2 transition-all min-h-[100px] ${
                  answer === false 
                    ? 'bg-red-100 border-red-400 text-red-700 shadow-lg shadow-red-500/20' 
                    : 'bg-white/70 border-stone-300 text-stone-700 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/10'
                }`}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer(false)}
              >
                <X className="h-8 w-8 mx-auto mb-3" />
                <span className="font-medium text-lg">No</span>
              </motion.button>
            </div>
            {error && (
              <div className="flex items-center justify-center space-x-2 text-red-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Completion Screen
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-purple-950/20 to-stone-100 text-stone-800">
        {/* Cursor follower */}
        <motion.div
          className="fixed top-0 left-0 w-4 h-4 bg-gradient-to-r from-purple-400/20 via-cyan-400/25 via-yellow-400/25 to-pink-400/20 rounded-full pointer-events-none z-30 mix-blend-difference"
          animate={{
            x: mousePosition.x - 8,
            y: mousePosition.y - 8,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <ShareWithMeLogo size="lg" />
          </motion.div>

          {/* Completion Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-stone-200 shadow-2xl">
              <CardContent className="p-8 sm:p-12 text-center space-y-8">
                {/* Success Animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 10 }}
                  className="w-24 h-24 mx-auto mb-8"
                >
                  <div className="w-full h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="h-12 w-12 text-white" />
                  </div>
                </motion.div>

                {/* Content */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="space-y-6"
                >
                  <h1 className="text-3xl sm:text-4xl font-bold text-stone-900">
                    Quiz Complete! 🎉
                  </h1>
                  
                  <div className="space-y-4">
                    <p className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
                      Great work! Our AI has analysed your personality and preferences to create your unique flatmate matching profile.
                    </p>
                    
                    <div className="bg-gradient-to-r from-purple-50 via-cyan-50 to-emerald-50 rounded-xl p-6 border border-purple-200">
                      <p className="text-stone-700 font-medium">
                        {user ? (
                          "Your profile has been saved and you're ready to find compatible flatmates!"
                        ) : (
                          "Sign up now to save your results and start finding your perfect flatmate matches."
                        )}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="flex flex-col gap-3 sm:gap-4 sm:flex-row justify-center pt-8"
                >
                  {user ? (
                    // User is logged in - show matches
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto min-h-[52px] sm:min-h-[56px] text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500 hover:from-purple-600 hover:via-cyan-600 hover:to-emerald-600 border-0 shadow-lg"
                      onClick={() => {
                        console.log('🎯 User logged in, proceeding to matches');
                        onQuizComplete();
                      }}
                    >
                      <Brain className="mr-2 h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">View My Matches</span>
                      <ArrowRight className="ml-2 h-5 w-5 flex-shrink-0" />
                    </Button>
                  ) : (
                    // User not logged in - prompt for account creation
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto min-h-[52px] sm:min-h-[56px] text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500 hover:from-purple-600 hover:via-cyan-600 hover:to-emerald-600 border-0 shadow-lg"
                      onClick={() => {
                        console.log('🔐 User not logged in, prompting for account creation');
                        if (onAuthRequired) {
                          onAuthRequired();
                        } else {
                          console.warn('⚠️ No auth handler provided');
                        }
                      }}
                    >
                      <UserPlus className="mr-2 h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">Create Account to Continue</span>
                      <ArrowRight className="ml-2 h-5 w-5 flex-shrink-0" />
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto min-h-[52px] sm:min-h-[56px] text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 border-2 border-stone-300 hover:border-purple-400 hover:bg-purple-50"
                    onClick={onBack}
                  >
                    <ArrowLeft className="mr-2 h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Back to Home</span>
                  </Button>
                </motion.div>

                {/* Error display */}
                {completionError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm"
                  >
                    {completionError}
                  </motion.div>
                )}

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="text-sm text-stone-500 pt-4"
                >
                  🔒 Your data is secure and private • 🆓 Always free • ✅ 100% verified community
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Quiz Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-purple-950/20 to-stone-100 text-stone-800">
      {/* Cursor follower - desktop only */}
      <motion.div
        className="fixed top-0 left-0 w-4 h-4 bg-gradient-to-r from-purple-400/20 via-cyan-400/25 via-yellow-400/25 to-pink-400/20 rounded-full pointer-events-none z-30 mix-blend-difference hidden md:block"
        animate={{
          x: mousePosition.x - 8,
          y: mousePosition.y - 8,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
      />

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="flex items-center text-stone-600 hover:text-purple-600 p-2 sm:p-3"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          
          <ShareWithMeLogo size="md" />
          
          <div className="text-right text-sm text-stone-600 min-w-[100px]">
            <div className="font-medium">Step {categoryProgress} of {categories.length}</div>
            <div className="text-xs text-stone-500">{currentCategory}</div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center text-sm text-stone-600">
            <span>Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2 bg-stone-200" />
        </motion.div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="mt-8"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-stone-200 shadow-xl">
              <CardHeader className="space-y-6 p-6 sm:p-8">
                {/* Question Icon & Category */}
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <currentQuestion.icon className="h-6 w-6 text-white" />
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 px-3 py-1">
                    {currentQuestion.category}
                  </Badge>
                </div>

                {/* Question */}
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                    {currentQuestion.question}
                  </h2>
                  {currentQuestion.description && (
                    <p className="text-stone-600 text-base sm:text-lg leading-relaxed">
                      {currentQuestion.description}
                    </p>
                  )}
                </div>

                {/* General validation error */}
                {validationErrors.general && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{validationErrors.general}</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="px-6 sm:px-8 pb-8 space-y-8">
                {/* Question Input */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  {renderQuestionInput()}
                </motion.div>

                {/* Navigation Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="flex justify-between items-center pt-6"
                >
                  <Button 
                    variant="ghost" 
                    onClick={prevQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center text-stone-600 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex items-center space-x-3">
                    {/* Mobile: Keyboard hint */}
                    <p className="text-xs text-stone-500 hidden sm:block">
                      Press → or Enter to continue
                    </p>
                    
                    <Button 
                      onClick={nextQuestion}
                      disabled={!isCurrentAnswered() || isLoading}
                      className={`px-6 py-2 sm:px-8 sm:py-3 font-medium transition-all ${
                        isCurrentAnswered() 
                          ? 'bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                          : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Processing...</span>
                        </div>
                      ) : currentQuestionIndex === quizQuestions.length - 1 ? (
                        <div className="flex items-center space-x-2">
                          <span>Complete Quiz</span>
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>Next</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};