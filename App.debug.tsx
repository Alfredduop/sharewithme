import React from 'react';
import { Button } from "./components/ui/button";
import { ShareWithMeLogo } from "./components/ShareWithMeLogo";

export default function AppDebug() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-purple-950/20 to-stone-100 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <ShareWithMeLogo size="lg" />
        <h1 className="text-3xl font-bold text-stone-900">
          Share With Me Debug Mode
        </h1>
        <p className="text-stone-600">
          If you can see this, the basic React setup is working.
        </p>
        <Button onClick={() => alert('Button clicked!')}>
          Test Button
        </Button>
      </div>
    </div>
  );
}