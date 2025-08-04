import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { uploadProfilePhoto, deleteProfilePhoto } from "../lib/supabase";
import { 
  Camera, 
  Upload, 
  Trash2, 
  User, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Image as ImageIcon
} from "lucide-react";

interface ProfilePhotoUploadProps {
  userId: string;
  currentPhotoUrl?: string;
  onPhotoUploaded: (photoUrl: string) => void;
  onPhotoDeleted: () => void;
  className?: string;
}

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  userId,
  currentPhotoUrl,
  onPhotoUploaded,
  onPhotoDeleted,
  className = ""
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setSuccess(null);
    setIsUploading(true);

    try {
      const photoUrl = await uploadProfilePhoto(file, userId);
      
      if (photoUrl) {
        onPhotoUploaded(photoUrl);
        setSuccess("Profile photo uploaded successfully!");
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to upload photo. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (allowedTypes.includes(file.type)) {
        handleFileSelect(file);
      } else {
        setError("Please upload a JPEG, PNG, or WebP image.");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDeletePhoto = async () => {
    if (!currentPhotoUrl) return;

    setError(null);
    setSuccess(null);
    setIsDeleting(true);

    try {
      const success = await deleteProfilePhoto(userId, currentPhotoUrl);
      
      if (success) {
        onPhotoDeleted();
        setSuccess("Profile photo deleted successfully!");
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to delete photo. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete photo. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Photo Display */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-stone-200 bg-stone-100 shadow-lg">
            {currentPhotoUrl ? (
              <ImageWithFallback
                src={currentPhotoUrl}
                alt="Profile photo"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-cyan-100">
                <User className="h-12 w-12 text-stone-400" />
              </div>
            )}
          </div>
          
          {/* Photo Actions Overlay */}
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/90 hover:bg-white text-stone-900"
                onClick={triggerFileInput}
                disabled={isUploading || isDeleting}
              >
                <Camera className="h-3 w-3" />
              </Button>
              {currentPhotoUrl && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="bg-red-500/90 hover:bg-red-600 text-white"
                  onClick={handleDeletePhoto}
                  disabled={isUploading || isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Upload Status */}
        {currentPhotoUrl ? (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Photo uploaded
          </Badge>
        ) : (
          <Badge variant="outline" className="text-stone-600">
            <ImageIcon className="h-3 w-3 mr-1" />
            No photo yet
          </Badge>
        )}
      </div>

      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-all duration-200 cursor-pointer ${
          dragActive 
            ? 'border-purple-400 bg-purple-50' 
            : 'border-stone-300 hover:border-purple-300 hover:bg-purple-25'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={triggerFileInput}
      >
        <CardContent className="p-6 text-center space-y-4">
          <motion.div
            className="mx-auto w-12 h-12 bg-gradient-to-br from-purple-100 to-cyan-100 rounded-full flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 text-purple-600 animate-spin" />
            ) : (
              <Upload className="h-6 w-6 text-purple-600" />
            )}
          </motion.div>

          <div className="space-y-2">
            <h3 className="font-medium text-stone-900">
              {currentPhotoUrl ? 'Update your photo' : 'Upload your profile photo'}
            </h3>
            <p className="text-sm text-stone-600">
              Drag and drop an image here, or click to select
            </p>
            <p className="text-xs text-stone-500">
              JPEG, PNG, or WebP • Max 5MB
            </p>
          </div>

          {!currentPhotoUrl && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs text-purple-700">
                💡 <strong>Pro tip:</strong> A clear, friendly photo helps you get 3x more matches!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button
          onClick={triggerFileInput}
          disabled={isUploading || isDeleting}
          className="flex-1"
          variant={currentPhotoUrl ? "outline" : "default"}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {currentPhotoUrl ? 'Change Photo' : 'Upload Photo'}
            </>
          )}
        </Button>

        {currentPhotoUrl && (
          <Button
            onClick={handleDeletePhoto}
            disabled={isUploading || isDeleting}
            variant="destructive"
            className="px-4"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Alert className="border-emerald-200 bg-emerald-50">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-700">
              {success}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Guidelines */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-stone-900 mb-2">Photo Guidelines</h4>
        <ul className="text-xs text-stone-600 space-y-1">
          <li>• Use a clear, recent photo of yourself</li>
          <li>• Make sure your face is clearly visible</li>
          <li>• Avoid sunglasses or heavy filters</li>
          <li>• Keep it friendly and approachable</li>
          <li>• Group photos with multiple people aren't ideal</li>
        </ul>
      </div>
    </div>
  );
};

export default ProfilePhotoUpload;