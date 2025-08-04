import { PersonalityQuizResult } from './supabase';

// Enhanced personality traits with precise scoring weights
export interface PersonalityTraits {
  lifestyle: 'social' | 'quiet' | 'balanced';
  social_energy: 'extrovert' | 'introvert' | 'balanced';
  cleanliness: 'very_clean' | 'moderate' | 'relaxed';
  schedule: 'early_bird' | 'night_owl' | 'flexible';
  noise_tolerance: 'high' | 'moderate' | 'low';
  guest_policy: 'frequent' | 'occasional' | 'minimal';
  communication_style: 'direct' | 'diplomatic' | 'casual';
  conflict_resolution: 'direct' | 'mediated' | 'avoidant';
  shared_spaces: 'high' | 'moderate' | 'low';
  personal_space: 'high' | 'moderate' | 'low';
  financial_approach: 'shared_equally' | 'proportional' | 'separate';
  long_term_goals: 'studying' | 'career_focused' | 'exploring' | 'settling';
}

export interface MatchPreferences {
  age_range: [number, number];
  location_preferences: string[];
  lifestyle_compatibility: string[];
  deal_breakers: string[];
}

export interface PropertyPreferences {
  furnished_room: 'Required' | 'Preferred' | 'Flexible' | 'Don\'t want furnished';
  bathroom: 'Own bathroom (ensuite)' | 'Shared bathroom' | 'Flexible';
  max_flatmates: 'Just me (studio/1BR)' | '1 other flatmate' | '2-3 flatmates' | '4+ flatmates' | 'Flexible';
  internet: 'Required (fast broadband)' | 'Required (basic internet)' | 'Nice to have' | 'Not important';
  parking: 'Required (off-street)' | 'Required (street parking okay)' | 'Nice to have' | 'Flexible' | 'Don\'t need parking';
}

export interface QuizAnswers {
  [key: string]: any;
}

export interface CompatibilityScore {
  overall: number;
  breakdown: {
    personality: number;
    lifestyle: number;
    preferences: number;
    dealBreakers: number;
  };
  matchReasons: string[];
  concerns: string[];
}

// Comprehensive input validation
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateQuizAnswers = (answers: QuizAnswers): QuizAnswers => {
  if (!answers || typeof answers !== 'object') {
    throw new ValidationError('Quiz answers must be a valid object');
  }

  const validated: QuizAnswers = {};
  
  // Age validation
  if (answers.age !== undefined) {
    const age = parseInt(String(answers.age));
    if (isNaN(age) || age < 18 || age > 100) {
      throw new ValidationError('Age must be between 18 and 100', 'age');
    }
    validated.age = age;
  }

  // Occupation validation
  const validOccupations = ['Student', 'Full-time worker', 'Part-time worker', 'Freelancer', 'Job seeker', 'Other'];
  if (answers.occupation && !validOccupations.includes(answers.occupation)) {
    throw new ValidationError('Invalid occupation value', 'occupation');
  }
  validated.occupation = answers.occupation;

  // State validation
  const validStates = [
    'New South Wales (NSW)', 'Victoria (VIC)', 'Queensland (QLD)', 'Western Australia (WA)',
    'South Australia (SA)', 'Tasmania (TAS)', 'Australian Capital Territory (ACT)', 'Northern Territory (NT)'
  ];
  if (answers.state && !validStates.includes(answers.state)) {
    throw new ValidationError('Invalid Australian state or territory', 'state');
  }
  validated.state = answers.state;

  // Location preferences validation
  if (answers.preferred_locations) {
    if (typeof answers.preferred_locations !== 'string') {
      throw new ValidationError('Preferred locations must be a string', 'preferred_locations');
    }
    // Clean and validate locations
    const locations = answers.preferred_locations
      .split(',')
      .map((loc: string) => loc.trim())
      .filter((loc: string) => loc.length > 0 && loc.length <= 100);
    
    if (locations.length === 0) {
      throw new ValidationError('At least one location preference is required', 'preferred_locations');
    }
    validated.preferred_locations = locations.join(', ');
  }

  // Slider values validation (0-10 scale)
  const sliderFields = ['morning_person', 'noise_sensitivity', 'socialness', 'cleanliness', 'common_areas', 'cooking'];
  sliderFields.forEach(field => {
    if (answers[field] !== undefined) {
      const value = parseInt(String(answers[field]));
      if (isNaN(value) || value < 0 || value > 10) {
        throw new ValidationError(`${field} must be between 0 and 10`, field);
      }
      validated[field] = value;
    }
  });

  // Budget validation
  if (answers.budget !== undefined) {
    const budget = parseInt(String(answers.budget));
    if (isNaN(budget) || budget < 50 || budget > 1000) {
      throw new ValidationError('Budget must be between $50 and $1000 per week', 'budget');
    }
    validated.budget = budget;
  }

  // Array validation for checkboxes
  const arrayFields = ['location_preference', 'interests', 'music_taste'];
  arrayFields.forEach(field => {
    if (answers[field] !== undefined) {
      if (!Array.isArray(answers[field])) {
        throw new ValidationError(`${field} must be an array`, field);
      }
      // Filter out invalid selections and limit length
      validated[field] = answers[field]
        .filter((item: any) => typeof item === 'string' && item.length <= 50)
        .slice(0, 20); // Limit to 20 selections max
    }
  });

  // Boolean validation
  const booleanFields = ['parties', 'agreeToTerms', 'marketingEmails', 'agreeToIdVerification'];
  booleanFields.forEach(field => {
    if (answers[field] !== undefined) {
      validated[field] = Boolean(answers[field]);
    }
  });

  // Text field validation
  if (answers.bio !== undefined) {
    if (typeof answers.bio !== 'string') {
      throw new ValidationError('Bio must be a string', 'bio');
    }
    validated.bio = answers.bio.trim().slice(0, 2000); // Limit bio length
  }

  // Copy other validated string fields
  const stringFields = ['bedtime', 'guests', 'dishes', 'smoking', 'drinking', 'pets', 
                       'furnished_room', 'bathroom', 'max_flatmates', 'internet', 'parking', 'gender_preference'];
  stringFields.forEach(field => {
    if (answers[field] && typeof answers[field] === 'string') {
      validated[field] = answers[field].trim();
    }
  });

  return validated;
};

// Enhanced personality analysis with better classification logic
export const analyzePersonality = (answers: QuizAnswers): PersonalityTraits => {
  const validated = validateQuizAnswers(answers);

  return {
    lifestyle: determineLifestyle(validated),
    social_energy: determineSocialEnergy(validated),
    cleanliness: determineCleanlinessLevel(validated),
    schedule: determineSchedule(validated),
    noise_tolerance: determineNoiseTolerance(validated),
    guest_policy: determineGuestPolicy(validated),
    communication_style: determineCommunicationStyle(validated),
    conflict_resolution: determineConflictResolution(validated),
    shared_spaces: determineSharedSpaceUsage(validated),
    personal_space: determinePersonalSpaceNeeds(validated),
    financial_approach: determineFinancialApproach(validated),
    long_term_goals: determineLongTermGoals(validated)
  };
};

// Enhanced trait determination functions
const determineLifestyle = (answers: QuizAnswers): PersonalityTraits['lifestyle'] => {
  const interests = answers.interests || [];
  const parties = answers.parties;
  const guests = answers.guests;
  const socialness = parseInt(answers.socialness) || 5;

  let socialScore = 0;
  let quietScore = 0;

  // Interest-based scoring
  if (interests.includes('Partying/nightlife')) socialScore += 2;
  if (interests.includes('Music/concerts')) socialScore += 1;
  if (interests.includes('Sports')) socialScore += 1;
  if (interests.includes('Outdoor activities')) socialScore += 1;

  if (interests.includes('Reading')) quietScore += 2;
  if (interests.includes('Study groups')) quietScore += 1;
  if (interests.includes('Art/creative stuff')) quietScore += 1;
  if (interests.includes('Gaming')) quietScore += 1;

  // Party and guest preferences
  if (parties === true) socialScore += 2;
  if (parties === false) quietScore += 2;

  if (guests === 'Multiple times a week' || guests === 'Weekly') socialScore += 2;
  if (guests === 'Rarely/never') quietScore += 2;

  // Socialness scale
  if (socialness >= 8) socialScore += 2;
  else if (socialness >= 6) socialScore += 1;
  else if (socialness <= 2) quietScore += 2;
  else if (socialness <= 4) quietScore += 1;

  if (socialScore > quietScore + 1) return 'social';
  if (quietScore > socialScore + 1) return 'quiet';
  return 'balanced';
};

const determineSocialEnergy = (answers: QuizAnswers): PersonalityTraits['social_energy'] => {
  const socialness = parseInt(answers.socialness) || 5;
  const guests = answers.guests;
  const parties = answers.parties;
  const commonAreas = parseInt(answers.common_areas) || 5;

  let extrovertScore = 0;
  let introvertScore = 0;

  // Socialness is the primary indicator
  if (socialness >= 8) extrovertScore += 3;
  else if (socialness >= 7) extrovertScore += 2;
  else if (socialness >= 6) extrovertScore += 1;
  else if (socialness <= 2) introvertScore += 3;
  else if (socialness <= 3) introvertScore += 2;
  else if (socialness <= 4) introvertScore += 1;

  // Guest frequency
  if (guests === 'Multiple times a week') extrovertScore += 2;
  else if (guests === 'Weekly') extrovertScore += 1;
  else if (guests === 'Rarely/never') introvertScore += 2;

  // Party tolerance
  if (parties === true) extrovertScore += 1;
  else if (parties === false) introvertScore += 1;

  // Common area usage
  if (commonAreas >= 8) extrovertScore += 1;
  else if (commonAreas <= 3) introvertScore += 1;

  if (extrovertScore > introvertScore + 1) return 'extrovert';
  if (introvertScore > extrovertScore + 1) return 'introvert';
  return 'balanced';
};

const determineCleanlinessLevel = (answers: QuizAnswers): PersonalityTraits['cleanliness'] => {
  const cleanliness = parseInt(answers.cleanliness) || 5;
  const dishes = answers.dishes;

  let score = cleanliness;

  // Adjust based on dish habits
  if (dishes === 'Immediately after eating') score += 2;
  else if (dishes === 'Same day') score += 1;
  else if (dishes === 'Within 2-3 days') score -= 1;
  else if (dishes === 'When I run out of clean ones') score -= 2;
  else if (dishes === 'What dishes? (takeaway life)') score -= 1;

  // Normalize score
  score = Math.max(0, Math.min(10, score));

  if (score >= 8) return 'very_clean';
  if (score <= 4) return 'relaxed';
  return 'moderate';
};

const determineSchedule = (answers: QuizAnswers): PersonalityTraits['schedule'] => {
  const morningPerson = parseInt(answers.morning_person) || 5;
  const bedtime = answers.bedtime;

  let score = morningPerson;

  // Adjust based on bedtime
  if (bedtime === 'Before 9pm') score += 2;
  else if (bedtime === '9-10pm') score += 1;
  else if (bedtime === '12-1am') score -= 1;
  else if (bedtime === 'After 1am') score -= 2;

  if (score >= 7) return 'early_bird';
  if (score <= 3) return 'night_owl';
  return 'flexible';
};

const determineNoiseTolerance = (answers: QuizAnswers): PersonalityTraits['noise_tolerance'] => {
  const sensitivity = parseInt(answers.noise_sensitivity) || 5;
  
  // Inverse relationship: high sensitivity = low tolerance
  if (sensitivity >= 8) return 'low';
  if (sensitivity <= 3) return 'high';
  return 'moderate';
};

const determineGuestPolicy = (answers: QuizAnswers): PersonalityTraits['guest_policy'] => {
  const guests = answers.guests;
  const parties = answers.parties;

  if (guests === 'Multiple times a week' || (guests === 'Weekly' && parties === true)) {
    return 'frequent';
  }
  if (guests === 'Rarely/never' || parties === false) {
    return 'minimal';
  }
  return 'occasional';
};

const determineCommunicationStyle = (answers: QuizAnswers): PersonalityTraits['communication_style'] => {
  const socialness = parseInt(answers.socialness) || 5;
  const occupation = answers.occupation;

  // For now, use social energy as a proxy
  if (socialness >= 7 && occupation === 'Full-time worker') return 'direct';
  if (socialness <= 4) return 'casual';
  return 'diplomatic';
};

const determineConflictResolution = (answers: QuizAnswers): PersonalityTraits['conflict_resolution'] => {
  const socialness = parseInt(answers.socialness) || 5;
  
  // Use personality indicators as proxy
  if (socialness >= 7) return 'direct';
  if (socialness <= 3) return 'avoidant';
  return 'mediated';
};

const determineSharedSpaceUsage = (answers: QuizAnswers): PersonalityTraits['shared_spaces'] => {
  const usage = parseInt(answers.common_areas) || 5;
  
  if (usage >= 7) return 'high';
  if (usage <= 3) return 'low';
  return 'moderate';
};

const determinePersonalSpaceNeeds = (answers: QuizAnswers): PersonalityTraits['personal_space'] => {
  const socialness = parseInt(answers.socialness) || 5;
  const commonAreas = parseInt(answers.common_areas) || 5;
  
  // Inverse relationship with social preferences
  const spaceScore = 10 - ((socialness + commonAreas) / 2);
  
  if (spaceScore >= 7) return 'high';
  if (spaceScore <= 3) return 'low';
  return 'moderate';
};

const determineFinancialApproach = (answers: QuizAnswers): PersonalityTraits['financial_approach'] => {
  // For now, default to shared_equally
  // Could be enhanced with specific financial questions in the future
  return 'shared_equally';
};

const determineLongTermGoals = (answers: QuizAnswers): PersonalityTraits['long_term_goals'] => {
  const occupation = answers.occupation;
  const age = parseInt(answers.age) || 25;
  
  if (occupation === 'Student') return 'studying';
  if (occupation === 'Full-time worker' && age >= 25) return 'career_focused';
  if (age >= 30) return 'settling';
  return 'exploring';
};

// Enhanced match preferences extraction
export const extractMatchPreferences = (answers: QuizAnswers): MatchPreferences => {
  const validated = validateQuizAnswers(answers);
  const age = parseInt(validated.age) || 25;
  
  // Parse multiple locations from the text input
  const locationsList = validated.preferred_locations 
    ? validated.preferred_locations.split(',').map((loc: string) => loc.trim()).filter((loc: string) => loc.length > 0)
    : [];
  
  // Combine location preferences and specific locations
  const allLocationPreferences = [
    ...(validated.location_preference || []),
    ...locationsList
  ];
  
  return {
    age_range: [Math.max(18, age - 8), Math.min(65, age + 8)] as [number, number],
    location_preferences: allLocationPreferences,
    lifestyle_compatibility: validated.interests || [],
    deal_breakers: extractDealBreakers(validated)
  };
};

const extractDealBreakers = (answers: QuizAnswers): string[] => {
  const dealBreakers: string[] = [];
  
  if (answers.smoking === 'Prefer smoke-free house') dealBreakers.push('no_smoking');
  if (answers.drinking === 'Prefer alcohol-free home') dealBreakers.push('no_alcohol');
  if (answers.pets === 'Allergic/prefer no pets') dealBreakers.push('no_pets');
  if (answers.parties === false) dealBreakers.push('no_parties');
  
  return dealBreakers;
};

// Enhanced property preferences extraction
export const extractPropertyPreferences = (answers: QuizAnswers): PropertyPreferences => {
  const validated = validateQuizAnswers(answers);
  
  return {
    furnished_room: validated.furnished_room || 'Flexible',
    bathroom: validated.bathroom || 'Flexible',
    max_flatmates: validated.max_flatmates || 'Flexible',
    internet: validated.internet || 'Required (basic internet)',
    parking: validated.parking || 'Flexible'
  };
};

// Advanced compatibility scoring algorithm with property owner consideration
export const calculateCompatibilityScore = (
  user1: PersonalityQuizResult,
  user2: PersonalityQuizResult,
  propertyContext?: {
    isPropertyOwner?: boolean;
    propertyRequirements?: PropertyPreferences;
    houseRules?: string[];
  }
): CompatibilityScore => {
  try {
    const personalityScore = calculatePersonalityCompatibility(user1.personality_traits, user2.personality_traits);
    const lifestyleScore = calculateLifestyleCompatibility(user1.answers, user2.answers);
    const preferencesScore = calculatePreferencesCompatibility(user1.match_preferences, user2.match_preferences);
    const dealBreakerScore = calculateDealBreakerCompatibility(user1.match_preferences, user2.match_preferences);
    
    // Enhanced property compatibility for property owners
    const propertyScore = propertyContext?.isPropertyOwner 
      ? calculatePropertyOwnerCompatibility(user2, propertyContext)
      : calculatePropertyPreferencesCompatibility(user1.property_preferences, user2.property_preferences);

    // Weighted overall score - different weights for property owners vs flatmate seekers
    let overall: number;
    if (propertyContext?.isPropertyOwner) {
      // Property owners prioritize: reliability, cleanliness, respectfulness
      overall = Math.round(
        personalityScore * 0.35 +   // Personality fit is crucial
        lifestyleScore * 0.25 +     // Lifestyle compatibility
        propertyScore * 0.25 +      // Property-specific requirements
        dealBreakerScore * 0.15     // Deal breakers are very important
      );
    } else {
      // Flatmate seekers prioritize: personality, lifestyle, preferences
      overall = Math.round(
        personalityScore * 0.4 +
        lifestyleScore * 0.3 +
        preferencesScore * 0.2 +
        dealBreakerScore * 0.1
      );
    }

    const { matchReasons, concerns } = generateMatchInsights(user1, user2, {
      personality: personalityScore,
      lifestyle: lifestyleScore,
      preferences: preferencesScore,
      dealBreakers: dealBreakerScore
    }, propertyContext);

    return {
      overall: Math.max(0, Math.min(100, overall)),
      breakdown: {
        personality: personalityScore,
        lifestyle: lifestyleScore,
        preferences: preferencesScore,
        dealBreakers: dealBreakerScore
      },
      matchReasons,
      concerns
    };
  } catch (error) {
    console.error('Error calculating compatibility score:', error);
    // Return a basic compatibility score even if calculation fails
    return generateFallbackCompatibilityScore(user1, user2);
  }
};

// Fallback compatibility scoring when main algorithm fails
const generateFallbackCompatibilityScore = (
  user1: PersonalityQuizResult, 
  user2: PersonalityQuizResult
): CompatibilityScore => {
  // Basic compatibility based on simple factors
  let basicScore = 60; // Start with moderate compatibility
  
  try {
    // Age compatibility
    const age1 = parseInt(user1.answers.age) || 25;
    const age2 = parseInt(user2.answers.age) || 25;
    const ageDiff = Math.abs(age1 - age2);
    if (ageDiff <= 5) basicScore += 10;
    else if (ageDiff <= 10) basicScore += 5;
    
    // State compatibility
    if (user1.answers.state === user2.answers.state) {
      basicScore += 10;
    }
    
    // Occupation compatibility
    if (user1.answers.occupation === user2.answers.occupation) {
      basicScore += 5;
    }
    
    return {
      overall: Math.min(100, Math.max(0, basicScore)),
      breakdown: {
        personality: basicScore,
        lifestyle: basicScore,
        preferences: basicScore,
        dealBreakers: 100
      },
      matchReasons: ['Basic compatibility assessment'],
      concerns: ['Limited matching data available']
    };
  } catch (error) {
    console.error('Even fallback compatibility failed:', error);
    return {
      overall: 50,
      breakdown: { personality: 50, lifestyle: 50, preferences: 50, dealBreakers: 100 },
      matchReasons: ['Potential match'],
      concerns: ['Matching algorithm temporarily limited']
    };
  }
};

// Property owner specific compatibility assessment
const calculatePropertyOwnerCompatibility = (
  tenant: PersonalityQuizResult,
  propertyContext: { propertyRequirements?: PropertyPreferences; houseRules?: string[] }
): number => {
  let score = 75; // Start with good base score
  
  try {
    const tenantTraits = tenant.personality_traits;
    const tenantAnswers = tenant.answers;
    
    // Cleanliness is critical for property owners
    if (tenantTraits.cleanliness === 'very_clean') score += 15;
    else if (tenantTraits.cleanliness === 'moderate') score += 5;
    else if (tenantTraits.cleanliness === 'relaxed') score -= 10;
    
    // Responsibility indicators
    if (tenantAnswers.dishes === 'Immediately after eating') score += 10;
    else if (tenantAnswers.dishes === 'Same day') score += 5;
    else if (tenantAnswers.dishes === 'Within 2-3 days') score -= 5;
    else if (tenantAnswers.dishes === 'When I run out of clean ones') score -= 15;
    
    // Noise consideration (important for neighbors/property reputation)
    if (tenantTraits.noise_tolerance === 'low') score += 8; // Likely to be quiet
    if (tenantTraits.guest_policy === 'minimal') score += 10;
    else if (tenantTraits.guest_policy === 'frequent') score -= 8;
    
    // Occupation stability (property owners prefer stable tenants)
    if (tenantAnswers.occupation === 'Full-time worker') score += 12;
    else if (tenantAnswers.occupation === 'Student') score += 5;
    else if (tenantAnswers.occupation === 'Part-time worker') score += 3;
    else if (tenantAnswers.occupation === 'Job seeker') score -= 5;
    
    // Age stability factor
    const age = parseInt(tenantAnswers.age) || 25;
    if (age >= 25 && age <= 35) score += 8; // Mature but not too old
    else if (age >= 22 && age <= 40) score += 4;
    
    // Communication style (property owners prefer direct communicators)
    if (tenantTraits.communication_style === 'direct') score += 5;
    else if (tenantTraits.communication_style === 'diplomatic') score += 8; // Best for landlord relations
    
    return Math.max(0, Math.min(100, score));
  } catch (error) {
    console.error('Property owner compatibility calculation failed:', error);
    return 65; // Reasonable default
  }
};

// Enhanced property preferences compatibility
const calculatePropertyPreferencesCompatibility = (
  prefs1: PropertyPreferences,
  prefs2: PropertyPreferences
): number => {
  if (!prefs1 || !prefs2) return 70; // Reasonable default
  
  let score = 0;
  let comparisons = 0;
  
  // Furnished room compatibility
  if (prefs1.furnished_room === prefs2.furnished_room) score += 100;
  else if (prefs1.furnished_room === 'Flexible' || prefs2.furnished_room === 'Flexible') score += 80;
  else score += 40;
  comparisons++;
  
  // Bathroom compatibility  
  if (prefs1.bathroom === prefs2.bathroom) score += 100;
  else if (prefs1.bathroom === 'Flexible' || prefs2.bathroom === 'Flexible') score += 85;
  else score += 50;
  comparisons++;
  
  // Flatmate number compatibility
  if (prefs1.max_flatmates === prefs2.max_flatmates) score += 100;
  else if (prefs1.max_flatmates === 'Flexible' || prefs2.max_flatmates === 'Flexible') score += 80;
  else score += 60;
  comparisons++;
  
  // Internet compatibility
  if (prefs1.internet === prefs2.internet) score += 100;
  else if (prefs1.internet.includes('Required') && prefs2.internet.includes('Required')) score += 90;
  else if (prefs1.internet === 'Not important' || prefs2.internet === 'Not important') score += 70;
  else score += 80;
  comparisons++;
  
  // Parking compatibility
  if (prefs1.parking === prefs2.parking) score += 100;
  else if (prefs1.parking === 'Flexible' || prefs2.parking === 'Flexible') score += 85;
  else if (prefs1.parking === "Don't need parking" || prefs2.parking === "Don't need parking") score += 90;
  else score += 70;
  comparisons++;
  
  return comparisons > 0 ? Math.round(score / comparisons) : 70;
};

const calculatePersonalityCompatibility = (traits1: PersonalityTraits, traits2: PersonalityTraits): number => {
  let totalScore = 0;
  let weightSum = 0;

  // Define compatibility weights for each trait
  const traitWeights = {
    cleanliness: 25, // High importance
    noise_tolerance: 20,
    schedule: 15,
    social_energy: 15,
    guest_policy: 10,
    shared_spaces: 5,
    lifestyle: 5,
    personal_space: 3,
    communication_style: 2
  };

  // Calculate compatibility for high-importance traits
  totalScore += calculateTraitCompatibility(traits1.cleanliness, traits2.cleanliness, 'cleanliness') * traitWeights.cleanliness;
  totalScore += calculateTraitCompatibility(traits1.noise_tolerance, traits2.noise_tolerance, 'noise_tolerance') * traitWeights.noise_tolerance;
  totalScore += calculateTraitCompatibility(traits1.schedule, traits2.schedule, 'schedule') * traitWeights.schedule;
  totalScore += calculateTraitCompatibility(traits1.social_energy, traits2.social_energy, 'social_energy') * traitWeights.social_energy;
  totalScore += calculateTraitCompatibility(traits1.guest_policy, traits2.guest_policy, 'guest_policy') * traitWeights.guest_policy;
  totalScore += calculateTraitCompatibility(traits1.shared_spaces, traits2.shared_spaces, 'shared_spaces') * traitWeights.shared_spaces;
  totalScore += calculateTraitCompatibility(traits1.lifestyle, traits2.lifestyle, 'lifestyle') * traitWeights.lifestyle;
  totalScore += calculateTraitCompatibility(traits1.personal_space, traits2.personal_space, 'personal_space') * traitWeights.personal_space;
  totalScore += calculateTraitCompatibility(traits1.communication_style, traits2.communication_style, 'communication_style') * traitWeights.communication_style;

  weightSum = Object.values(traitWeights).reduce((sum, weight) => sum + weight, 0);

  return Math.round(totalScore / weightSum);
};

const calculateTraitCompatibility = (trait1: string, trait2: string, traitType: string): number => {
  if (trait1 === trait2) return 100; // Perfect match

  // Define compatibility matrices for each trait type
  const compatibilityMatrix: Record<string, Record<string, Record<string, number>>> = {
    cleanliness: {
      'very_clean': { 'moderate': 70, 'relaxed': 20 },
      'moderate': { 'very_clean': 70, 'relaxed': 80 },
      'relaxed': { 'very_clean': 20, 'moderate': 80 }
    },
    noise_tolerance: {
      'high': { 'moderate': 80, 'low': 30 },
      'moderate': { 'high': 80, 'low': 80 },
      'low': { 'high': 30, 'moderate': 80 }
    },
    schedule: {
      'early_bird': { 'flexible': 75, 'night_owl': 25 },
      'flexible': { 'early_bird': 75, 'night_owl': 75 },
      'night_owl': { 'early_bird': 25, 'flexible': 75 }
    },
    social_energy: {
      'extrovert': { 'balanced': 75, 'introvert': 40 },
      'balanced': { 'extrovert': 75, 'introvert': 75 },
      'introvert': { 'extrovert': 40, 'balanced': 75 }
    },
    guest_policy: {
      'frequent': { 'occasional': 70, 'minimal': 30 },
      'occasional': { 'frequent': 70, 'minimal': 80 },
      'minimal': { 'frequent': 30, 'occasional': 80 }
    },
    lifestyle: {
      'social': { 'balanced': 80, 'quiet': 40 },
      'balanced': { 'social': 80, 'quiet': 80 },
      'quiet': { 'social': 40, 'balanced': 80 }
    }
  };

  const matrix = compatibilityMatrix[traitType];
  if (matrix && matrix[trait1] && matrix[trait1][trait2] !== undefined) {
    return matrix[trait1][trait2];
  }

  // Default compatibility for unknown combinations
  return 60;
};

const calculateLifestyleCompatibility = (answers1: QuizAnswers, answers2: QuizAnswers): number => {
  let score = 0;
  let comparisons = 0;

  // Compare cooking habits
  const cooking1 = parseInt(answers1.cooking) || 5;
  const cooking2 = parseInt(answers2.cooking) || 5;
  const cookingDiff = Math.abs(cooking1 - cooking2);
  score += Math.max(0, 100 - (cookingDiff * 10));
  comparisons++;

  // Compare common area usage
  const commonAreas1 = parseInt(answers1.common_areas) || 5;
  const commonAreas2 = parseInt(answers2.common_areas) || 5;
  const commonAreasDiff = Math.abs(commonAreas1 - commonAreas2);
  score += Math.max(0, 100 - (commonAreasDiff * 12));
  comparisons++;

  // Compare interests overlap
  const interests1 = answers1.interests || [];
  const interests2 = answers2.interests || [];
  const commonInterests = interests1.filter((interest: string) => interests2.includes(interest));
  const totalInterests = [...new Set([...interests1, ...interests2])];
  const interestScore = totalInterests.length > 0 ? (commonInterests.length / totalInterests.length) * 100 : 50;
  score += interestScore;
  comparisons++;

  return comparisons > 0 ? Math.round(score / comparisons) : 50;
};

const calculatePreferencesCompatibility = (prefs1: MatchPreferences, prefs2: MatchPreferences): number => {
  let score = 0;
  let comparisons = 0;

  // Age range compatibility
  const [min1, max1] = prefs1.age_range;
  const [min2, max2] = prefs2.age_range;
  const ageOverlap = Math.max(0, Math.min(max1, max2) - Math.max(min1, min2));
  const totalAgeRange = Math.max(max1, max2) - Math.min(min1, min2);
  const ageScore = totalAgeRange > 0 ? (ageOverlap / totalAgeRange) * 100 : 0;
  score += ageScore;
  comparisons++;

  // Location preferences overlap
  const locations1 = prefs1.location_preferences || [];
  const locations2 = prefs2.location_preferences || [];
  const commonLocations = locations1.filter(loc => 
    locations2.some(loc2 => 
      loc.toLowerCase().includes(loc2.toLowerCase()) || 
      loc2.toLowerCase().includes(loc.toLowerCase())
    )
  );
  const locationScore = Math.max(locations1.length, locations2.length) > 0 ? 
    (commonLocations.length / Math.max(locations1.length, locations2.length)) * 100 : 50;
  score += locationScore;
  comparisons++;

  return comparisons > 0 ? Math.round(score / comparisons) : 50;
};

const calculateDealBreakerCompatibility = (prefs1: MatchPreferences, prefs2: MatchPreferences): number => {
  const dealBreakers1 = prefs1.deal_breakers || [];
  const dealBreakers2 = prefs2.deal_breakers || [];

  // Check for conflicting deal breakers
  const conflicts = dealBreakers1.filter(db => dealBreakers2.includes(db));
  
  if (conflicts.length > 0) {
    return Math.max(0, 100 - (conflicts.length * 25)); // Severe penalty for deal breaker conflicts
  }

  return 100; // No conflicts
};

const generateMatchInsights = (
  user1: PersonalityQuizResult,
  user2: PersonalityQuizResult,
  scores: { personality: number; lifestyle: number; preferences: number; dealBreakers: number },
  propertyContext?: { isPropertyOwner?: boolean; propertyRequirements?: PropertyPreferences; houseRules?: string[] }
): { matchReasons: string[]; concerns: string[] } => {
  const matchReasons: string[] = [];
  const concerns: string[] = [];

  const traits1 = user1.personality_traits;
  const traits2 = user2.personality_traits;

  // Personality-based insights
  if (traits1.cleanliness === traits2.cleanliness) {
    matchReasons.push(`Both prefer ${traits1.cleanliness} cleanliness standards`);
  } else if (Math.abs(['relaxed', 'moderate', 'very_clean'].indexOf(traits1.cleanliness) - 
                     ['relaxed', 'moderate', 'very_clean'].indexOf(traits2.cleanliness)) >= 2) {
    concerns.push('Different cleanliness expectations may cause friction');
  }

  if (traits1.schedule === traits2.schedule) {
    matchReasons.push(`Both are ${traits1.schedule.replace('_', ' ')} types`);
  } else if ((traits1.schedule === 'early_bird' && traits2.schedule === 'night_owl') ||
             (traits1.schedule === 'night_owl' && traits2.schedule === 'early_bird')) {
    concerns.push('Opposite sleep schedules might be challenging');
  }

  if (traits1.social_energy === traits2.social_energy) {
    matchReasons.push(`Similar social energy levels (${traits1.social_energy})`);
  }

  if (traits1.noise_tolerance === traits2.noise_tolerance) {
    matchReasons.push(`Compatible noise tolerance levels`);
  }

  // Lifestyle insights
  const interests1 = user1.answers.interests || [];
  const interests2 = user2.answers.interests || [];
  const commonInterests = interests1.filter((interest: string) => interests2.includes(interest));
  
  if (commonInterests.length >= 3) {
    matchReasons.push(`Share ${commonInterests.length} common interests`);
  } else if (commonInterests.length === 0) {
    concerns.push('Few shared interests - might have different lifestyles');
  }

  // Preference insights
  const locations1 = user1.match_preferences.location_preferences || [];
  const locations2 = user2.match_preferences.location_preferences || [];
  const locationOverlap = locations1.some(loc => 
    locations2.some(loc2 => 
      loc.toLowerCase().includes(loc2.toLowerCase()) || 
      loc2.toLowerCase().includes(loc.toLowerCase())
    )
  );
  
  if (locationOverlap) {
    matchReasons.push('Looking in similar areas');
  }

  // Deal breaker warnings
  const dealBreakers1 = user1.match_preferences.deal_breakers || [];
  const dealBreakers2 = user2.match_preferences.deal_breakers || [];
  const conflictingDealBreakers = dealBreakers1.filter(db => dealBreakers2.includes(db));
  
  if (conflictingDealBreakers.length > 0) {
    concerns.push(`Conflicting deal breakers: ${conflictingDealBreakers.join(', ')}`);
  }

  // Property owner specific insights
  if (propertyContext?.isPropertyOwner) {
    const tenant = user2;
    const tenantTraits = tenant.personality_traits;
    
    // Reliability indicators
    if (tenantTraits.cleanliness === 'very_clean') {
      matchReasons.push('Excellent cleanliness standards - ideal tenant');
    }
    
    if (tenant.answers.occupation === 'Full-time worker') {
      matchReasons.push('Stable employment - reliable for rent payments');
    }
    
    if (tenantTraits.noise_tolerance === 'low' && tenantTraits.guest_policy === 'minimal') {
      matchReasons.push('Quiet, respectful lifestyle - great for property reputation');
    }
    
    // Potential concerns for property owners
    if (tenantTraits.guest_policy === 'frequent') {
      concerns.push('Frequent guests might impact property wear');
    }
    
    if (tenant.answers.age < 22) {
      concerns.push('Younger tenant - consider experience with independent living');
    }
    
    if (tenantTraits.cleanliness === 'relaxed') {
      concerns.push('Relaxed cleanliness standards - may need clear expectations');
    }
  }

  return { matchReasons, concerns };
};

// Enhanced matching function for real-world scenarios
export const findBestMatches = (
  userProfile: PersonalityQuizResult,
  candidateProfiles: PersonalityQuizResult[],
  context?: {
    isUserPropertyOwner?: boolean;
    maxResults?: number;
    minimumScore?: number;
    prioritizeFactors?: ('personality' | 'lifestyle' | 'location' | 'reliability')[];
  }
): CompatibilityMatch[] => {
  try {
    const results = candidateProfiles.map(candidate => {
      const compatibility = calculateCompatibilityScore(
        userProfile, 
        candidate,
        context?.isUserPropertyOwner ? {
          isPropertyOwner: true,
          propertyRequirements: userProfile.property_preferences
        } : undefined
      );
      
      return {
        userId: candidate.answers.id || 'unknown',
        userName: `${candidate.answers.firstName || 'Unknown'} ${candidate.answers.lastName || ''}`.trim(),
        userAge: parseInt(candidate.answers.age) || 25,
        userLocation: candidate.answers.preferred_locations || 'Location not specified',
        userOccupation: candidate.answers.occupation || 'Occupation not specified',
        userBio: candidate.answers.bio || 'No bio available',
        userProfilePhoto: candidate.answers.profilePhotoUrl || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        compatibilityScore: compatibility.overall,
        sharedInterests: candidate.answers.interests || [],
        personalityAlignment: {
          cleanliness: compatibility.breakdown.personality,
          socialLevel: compatibility.breakdown.lifestyle,
          workSchedule: compatibility.breakdown.preferences,
          guestPolicy: compatibility.breakdown.dealBreakers,
          overall: compatibility.overall
        },
        matchReasons: compatibility.matchReasons,
        lastActive: 'Recently active' // This would come from real user activity data
      };
    });
    
    // Filter by minimum score
    const minScore = context?.minimumScore || 60;
    const filteredResults = results.filter(match => match.compatibilityScore >= minScore);
    
    // Sort by compatibility score
    const sortedResults = filteredResults.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    
    // Limit results
    const maxResults = context?.maxResults || 10;
    return sortedResults.slice(0, maxResults);
    
  } catch (error) {
    console.error('Error in findBestMatches:', error);
    return [];
  }
};