import React from 'react';
import { motion } from 'motion/react';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Bed, Bath, Users2, Wifi, Car, MapPin, Plus, X } from 'lucide-react';

interface PropertyPreferencesStepProps {
  propertyPreferences: {
    furnished_room: string;
    bathroom: string;
    max_flatmates: string;
    internet: string;
    parking: string;
  };
  targetLocations: string[];
  onPropertyPreferencesChange: (field: string, value: string) => void;
  onTargetLocationChange: (locations: string[]) => void;
}

// Popular Sydney suburbs for auto-complete suggestions
const popularSuburbs = [
  'Newtown', 'Surry Hills', 'Marrickville', 'Redfern', 'Chippendale', 'Ultimo',
  'Glebe', 'Enmore', 'Erskineville', 'Alexandria', 'Waterloo', 'Zetland',
  'Rosebery', 'Mascot', 'Randwick', 'Coogee', 'Bondi', 'Paddington',
  'Darlinghurst', 'Potts Point', 'Kings Cross', 'Woolloomooloo', 'Pyrmont',
  'Balmain', 'Leichhardt', 'Lilyfield', 'Rozelle', 'Annandale', 'Camperdown',
  'St Peters', 'Tempe', 'Sydenham', 'Marrickville South', 'Dulwich Hill'
];

export const PropertyPreferencesStep = ({
  propertyPreferences,
  targetLocations,
  onPropertyPreferencesChange,
  onTargetLocationChange
}: PropertyPreferencesStepProps) => {
  const [locationInput, setLocationInput] = React.useState('');
  const [filteredSuburbs, setFilteredSuburbs] = React.useState<string[]>([]);

  // Filter suburbs based on input
  React.useEffect(() => {
    if (locationInput.length > 0) {
      const filtered = popularSuburbs.filter(suburb =>
        suburb.toLowerCase().includes(locationInput.toLowerCase())
      ).slice(0, 8);
      setFilteredSuburbs(filtered);
    } else {
      setFilteredSuburbs([]);
    }
  }, [locationInput]);

  const addLocation = (location: string) => {
    if (!targetLocations.includes(location)) {
      onTargetLocationChange([...targetLocations, location]);
      setLocationInput('');
      setFilteredSuburbs([]);
    }
  };

  const removeLocation = (locationToRemove: string) => {
    onTargetLocationChange(targetLocations.filter(loc => loc !== locationToRemove));
  };

  const handleLocationInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && locationInput.trim()) {
      e.preventDefault();
      addLocation(locationInput.trim());
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Property Preferences</h2>
        <p className="text-gray-300">
          Help room seekers understand what your property offers and where it can match
        </p>
      </div>

      {/* Property Features */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Bed className="mr-2 h-5 w-5" />
          What does your property offer?
        </h3>

        {/* Furnished Room */}
        <div className="space-y-3">
          <Label className="text-white">Are rooms furnished?</Label>
          <RadioGroup
            value={propertyPreferences.furnished_room}
            onValueChange={(value) => onPropertyPreferencesChange('furnished_room', value)}
          >
            <div className="grid grid-cols-2 gap-3">
              {['Fully furnished', 'Partly furnished', 'Unfurnished', 'Flexible'].map((option) => (
                <motion.div
                  key={option}
                  whileHover={{ scale: 1.02 }}
                  className="group"
                >
                  <label
                    htmlFor={`furnished_${option}`}
                    className={`flex items-center space-x-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      propertyPreferences.furnished_room === option
                        ? 'bg-purple-500/20 border-purple-400/50'
                        : 'bg-black/20 border-white/10 hover:border-purple-400/30'
                    }`}
                  >
                    <RadioGroupItem value={option} id={`furnished_${option}`} />
                    <span className="text-white">{option}</span>
                  </label>
                </motion.div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Bathroom */}
        <div className="space-y-3">
          <Label className="text-white flex items-center">
            <Bath className="mr-2 h-4 w-4" />
            Bathroom arrangement
          </Label>
          <RadioGroup
            value={propertyPreferences.bathroom}
            onValueChange={(value) => onPropertyPreferencesChange('bathroom', value)}
          >
            <div className="space-y-2">
              {['Own bathroom (ensuite)', 'Shared bathroom', 'Multiple bathrooms available'].map((option) => (
                <motion.div
                  key={option}
                  whileHover={{ scale: 1.01 }}
                  className="group"
                >
                  <label
                    htmlFor={`bathroom_${option}`}
                    className={`flex items-center space-x-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      propertyPreferences.bathroom === option
                        ? 'bg-cyan-500/20 border-cyan-400/50'
                        : 'bg-black/20 border-white/10 hover:border-cyan-400/30'
                    }`}
                  >
                    <RadioGroupItem value={option} id={`bathroom_${option}`} />
                    <span className="text-white">{option}</span>
                  </label>
                </motion.div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Max Flatmates */}
        <div className="space-y-3">
          <Label className="text-white flex items-center">
            <Users2 className="mr-2 h-4 w-4" />
            How many flatmates total?
          </Label>
          <RadioGroup
            value={propertyPreferences.max_flatmates}
            onValueChange={(value) => onPropertyPreferencesChange('max_flatmates', value)}
          >
            <div className="grid grid-cols-2 gap-3">
              {['Just 1 person (me + tenant)', '2-3 people total', '4-5 people total', '6+ people total'].map((option) => (
                <motion.div
                  key={option}
                  whileHover={{ scale: 1.02 }}
                  className="group"
                >
                  <label
                    htmlFor={`flatmates_${option}`}
                    className={`flex items-center space-x-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      propertyPreferences.max_flatmates === option
                        ? 'bg-emerald-500/20 border-emerald-400/50'
                        : 'bg-black/20 border-white/10 hover:border-emerald-400/30'
                    }`}
                  >
                    <RadioGroupItem value={option} id={`flatmates_${option}`} />
                    <span className="text-white text-sm">{option}</span>
                  </label>
                </motion.div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Internet */}
        <div className="space-y-3">
          <Label className="text-white flex items-center">
            <Wifi className="mr-2 h-4 w-4" />
            Internet access
          </Label>
          <RadioGroup
            value={propertyPreferences.internet}
            onValueChange={(value) => onPropertyPreferencesChange('internet', value)}
          >
            <div className="grid grid-cols-2 gap-3">
              {['High-speed broadband', 'Standard internet', 'WiFi included', 'Not included'].map((option) => (
                <motion.div
                  key={option}
                  whileHover={{ scale: 1.02 }}
                  className="group"
                >
                  <label
                    htmlFor={`internet_${option}`}
                    className={`flex items-center space-x-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      propertyPreferences.internet === option
                        ? 'bg-blue-500/20 border-blue-400/50'
                        : 'bg-black/20 border-white/10 hover:border-blue-400/30'
                    }`}
                  >
                    <RadioGroupItem value={option} id={`internet_${option}`} />
                    <span className="text-white">{option}</span>
                  </label>
                </motion.div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Parking */}
        <div className="space-y-3">
          <Label className="text-white flex items-center">
            <Car className="mr-2 h-4 w-4" />
            Parking available
          </Label>
          <RadioGroup
            value={propertyPreferences.parking}
            onValueChange={(value) => onPropertyPreferencesChange('parking', value)}
          >
            <div className="grid grid-cols-2 gap-3">
              {['Off-street parking', 'Street parking available', 'No parking', 'Garage available'].map((option) => (
                <motion.div
                  key={option}
                  whileHover={{ scale: 1.02 }}
                  className="group"
                >
                  <label
                    htmlFor={`parking_${option}`}
                    className={`flex items-center space-x-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      propertyPreferences.parking === option
                        ? 'bg-yellow-500/20 border-yellow-400/50'
                        : 'bg-black/20 border-white/10 hover:border-yellow-400/30'
                    }`}
                  >
                    <RadioGroupItem value={option} id={`parking_${option}`} />
                    <span className="text-white">{option}</span>
                  </label>
                </motion.div>
              ))}
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Target Locations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <MapPin className="mr-2 h-5 w-5" />
          Additional Location Keywords
        </h3>
        <p className="text-gray-300 text-sm">
          Add nearby suburbs or areas to help room seekers find your property when they search for multiple locations
        </p>

        {/* Location Input */}
        <div className="relative">
          <Input
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            onKeyDown={handleLocationInputKeyDown}
            placeholder="Type a suburb name..."
            className="bg-black/20 border-white/20 text-white placeholder:text-gray-400"
          />
          
          {/* Suburb Suggestions */}
          {filteredSuburbs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg max-h-40 overflow-y-auto z-10"
            >
              {filteredSuburbs.map((suburb) => (
                <button
                  key={suburb}
                  onClick={() => addLocation(suburb)}
                  className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-colors"
                >
                  {suburb}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Selected Locations */}
        {targetLocations.length > 0 && (
          <div className="space-y-2">
            <Label className="text-white">Added locations:</Label>
            <div className="flex flex-wrap gap-2">
              {targetLocations.map((location) => (
                <motion.div
                  key={location}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Badge
                    variant="secondary"
                    className="bg-purple-500/20 text-purple-300 border-purple-400/50 pr-1"
                  >
                    {location}
                    <button
                      onClick={() => removeLocation(location)}
                      className="ml-2 hover:text-red-300 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-4">
        <p className="text-purple-300 text-sm">
          <strong>💡 Tip:</strong> These preferences help our AI match your property with compatible room seekers. 
          Adding nearby suburb names helps people searching in multiple areas find your listing.
        </p>
      </div>
    </div>
  );
};