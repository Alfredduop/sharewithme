import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { BarChart3, Eye, EyeOff, Trash2 } from "lucide-react";
import { simpleAnalytics } from "../lib/simpleAnalytics";

export const SimpleAnalyticsDashboard = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  // Only show in development
  const isDevelopment = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1'));

  useEffect(() => {
    if (!isDevelopment) return;

    const loadEvents = () => {
      const allEvents = simpleAnalytics.getEvents();
      setEvents(allEvents);
    };

    loadEvents();
    const interval = setInterval(loadEvents, 2000);
    return () => clearInterval(interval);
  }, [isDevelopment]);

  const clearData = () => {
    simpleAnalytics.clearEvents();
    setEvents([]);
  };

  if (!isDevelopment) {
    return null;
  }

  const eventCounts = events.reduce((acc, event) => {
    acc[event.event] = (acc[event.event] || 0) + 1;
    return acc;
  }, {});

  const recentEvents = events.slice(-10).reverse();

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 shadow-lg"
        size="sm"
      >
        {isVisible ? <EyeOff className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
      </Button>

      {/* Dashboard */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 w-80 max-h-96 z-40 bg-white border border-stone-200 rounded-lg shadow-xl overflow-hidden">
          <div className="p-3 bg-purple-50 border-b border-purple-200 flex items-center justify-between">
            <h3 className="font-semibold text-purple-900 flex items-center text-sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics ({events.length})
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearData}
              className="h-6 px-2"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          <div className="max-h-80 overflow-y-auto p-3 space-y-3">
            {/* Event Counts */}
            <div>
              <h4 className="text-xs font-semibold text-stone-700 mb-2">Event Types</h4>
              <div className="space-y-1">
                {Object.entries(eventCounts).slice(0, 5).map(([event, count]) => (
                  <div key={event} className="flex justify-between text-xs">
                    <span className="truncate">{event}</span>
                    <span className="text-purple-600 font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Events */}
            <div>
              <h4 className="text-xs font-semibold text-stone-700 mb-2">Recent Events</h4>
              <div className="space-y-1">
                {recentEvents.length === 0 ? (
                  <p className="text-xs text-stone-500">No events yet. Use the app to see analytics!</p>
                ) : (
                  recentEvents.map((event, index) => (
                    <Card key={index} className="p-2">
                      <div className="text-xs">
                        <div className="font-medium text-purple-700">{event.event}</div>
                        {event.properties && (
                          <div className="text-stone-600 mt-1">
                            {Object.entries(event.properties)
                              .filter(([key]) => key !== 'timestamp')
                              .slice(0, 2)
                              .map(([key, value]) => (
                                <div key={key}>{key}: {String(value)}</div>
                              ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SimpleAnalyticsDashboard;